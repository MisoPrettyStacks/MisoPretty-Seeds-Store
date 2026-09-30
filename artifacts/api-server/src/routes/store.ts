/**
 * STOREFRONT API — /api/store/*
 * ----------------------------------------------------------------------------
 * Implements the contract in lib/api-spec/openapi.yaml:
 *
 *   GET  /store/products              list the seed catalog
 *   GET  /store/shipping-options      list US shipping methods + flat rates
 *   POST /store/quote                 server-validated cart totals
 *   POST /store/checkout              create a Stripe Checkout session
 *   GET  /store/checkout/:sessionId   paid order confirmation
 *
 * Security notes:
 * - Prices/totals are ALWAYS computed server-side from the catalog in
 *   src/data/. The client only sends product ids + quantities.
 * - Request bodies are validated with the Zod schemas generated from the
 *   OpenAPI spec (@workspace/api-zod) before anything else happens.
 * - Stripe keys come only from environment variables (see src/lib/stripe.ts).
 */

import { Router, type IRouter, type Request, type Response } from "express";
import {
  CreateCheckoutSessionBody,
  GetCartQuoteBody,
  GetCheckoutConfirmationParams,
} from "@workspace/api-zod";
import { z } from "zod";
import { PRODUCTS } from "../data/products";
import { SHIPPING_OPTIONS } from "../data/shipping";
import { QuoteError, quoteCart, type CartQuote } from "../lib/catalog";
import { getStripe } from "../lib/stripe";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/** Where the shopper's browser lives — used for Stripe redirect URLs. */
function frontendBaseUrl(req: Request): string {
  const configured = process.env["FRONTEND_URL"];
  if (configured) return configured.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

/** Friendly message for a Zod validation failure (first issue only). */
function zodMessage(err: z.ZodError): string {
  const issue = err.issues[0];
  if (!issue) return "Please check your input and try again.";
  const where = issue.path.join(".");
  return where ? `${where}: ${issue.message}` : issue.message;
}

// ---------------------------------------------------------------------------
// GET /store/products
// ---------------------------------------------------------------------------
router.get("/store/products", (_req, res) => {
  res.json(PRODUCTS);
});

// ---------------------------------------------------------------------------
// GET /store/shipping-options
// ---------------------------------------------------------------------------
router.get("/store/shipping-options", (_req, res) => {
  res.json(SHIPPING_OPTIONS);
});

// ---------------------------------------------------------------------------
// POST /store/quote — validated cart totals (no payment involved)
// ---------------------------------------------------------------------------
router.post("/store/quote", (req, res) => {
  const parsed = GetCartQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, zodMessage(parsed.error));
    return;
  }

  try {
    const quote: CartQuote = quoteCart(parsed.data.items, parsed.data.shippingOptionId);
    res.json(quote);
  } catch (err) {
    if (err instanceof QuoteError) {
      badRequest(res, err.message);
      return;
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// POST /store/checkout — create a Stripe Checkout session
// ---------------------------------------------------------------------------
router.post("/store/checkout", async (req, res) => {
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, zodMessage(parsed.error));
    return;
  }

  let quote: CartQuote;
  try {
    quote = quoteCart(parsed.data.items, parsed.data.shippingOptionId);
  } catch (err) {
    if (err instanceof QuoteError) {
      badRequest(res, err.message);
      return;
    }
    throw err;
  }

  const stripe = getStripe();
  if (!stripe) {
    // No secret key configured — a designed state, not a crash.
    res.status(503).json({ error: "Checkout is temporarily unavailable." });
    return;
  }

  // Trim user-supplied strings before they go anywhere.
  const customerName = parsed.data.customer.name.trim();
  const customerEmail = parsed.data.customer.email.trim();
  const address = {
    line1: parsed.data.address.line1.trim(),
    line2: parsed.data.address.line2?.trim() || undefined,
    city: parsed.data.address.city.trim(),
    state: parsed.data.address.state.trim().toUpperCase(),
    postalCode: parsed.data.address.postalCode.trim(),
    country: "US" as const,
  };

  const baseUrl = frontendBaseUrl(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      // Snapshot the server-validated cart inside the session so the
      // confirmation page can rebuild the order without a database.
      // (Everything sensitive here comes from the server, not the browser.)
      metadata: {
        customer_name: customerName,
        items: JSON.stringify(quote.items),
        subtotal_in_cents: String(quote.subtotalInCents),
        shipping_in_cents: String(quote.shippingInCents),
        total_in_cents: String(quote.totalInCents),
        shipping_option_id: quote.shippingOption.id,
        ship_to: JSON.stringify({ name: customerName, ...address }),
      },
      line_items: quote.items.map((line) => ({
        price_data: {
          currency: "usd",
          unit_amount: line.unitAmountInCents,
          product_data: { name: `${line.name} — MisoPretty Seeds` },
        },
        quantity: line.quantity,
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: quote.shippingInCents,
              currency: "usd",
            },
            display_name: quote.shippingOption.name,
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],
      // Prefill the shipping address the shopper already typed.
      shipping_address_collection: { allowed_countries: ["US"] },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    res.json({ sessionId: session.id, checkoutUrl: session.url });
  } catch (err) {
    logger.error({ err }, "Stripe checkout session creation failed");
    res.status(502).json({
      error:
        "We couldn't start checkout just now. Please try again in a moment.",
    });
  }
});

// ---------------------------------------------------------------------------
// GET /store/checkout/:sessionId — paid order confirmation
// ---------------------------------------------------------------------------
router.get("/store/checkout/:sessionId", async (req, res) => {
  const parsed = GetCheckoutConfirmationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(404).json({ error: "Checkout session not found." });
    return;
  }

  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Checkout is temporarily unavailable." });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(
      parsed.data.sessionId,
    );

    if (session.payment_status !== "paid") {
      res.status(409).json({ error: "This checkout isn't paid yet." });
      return;
    }

    const items = JSON.parse(session.metadata?.["items"] ?? "[]") as CartQuote["items"];
    res.json({
      sessionId: session.id,
      status: "paid",
      email: session.customer_email ?? session.customer_details?.email ?? "",
      items,
      subtotalInCents: Number(session.metadata?.["subtotal_in_cents"] ?? 0),
      shippingInCents: Number(session.metadata?.["shipping_in_cents"] ?? 0),
      totalInCents: Number(session.metadata?.["total_in_cents"] ?? 0),
      currency: "usd",
    });
  } catch (err) {
    logger.error({ err }, "Stripe session retrieval failed");
    res.status(404).json({ error: "Checkout session not found." });
  }
});

export default router;

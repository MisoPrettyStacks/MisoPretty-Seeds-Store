/**
 * CART PRICING — server-side only.
 * ----------------------------------------------------------------------------
 * Every total the shopper sees at checkout is computed here from the
 * server-owned catalog. The browser sends { productId, quantity } pairs and a
 * shippingOptionId; this module resolves them against PRODUCTS and
 * SHIPPING_OPTIONS and returns validated line items + totals.
 */

import { getProductById, type Product } from "../data/products";
import {
  getShippingOptionById,
  type ShippingOption,
} from "../data/shipping";

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface QuoteLine {
  productId: string;
  name: string;
  quantity: number;
  unitAmountInCents: number;
  lineTotalInCents: number;
}

export interface CartQuote {
  items: QuoteLine[];
  subtotalInCents: number;
  shippingInCents: number;
  totalInCents: number;
  currency: "usd";
  shippingOption: ShippingOption;
}

export class QuoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteError";
  }
}

/**
 * Merge duplicate product ids (e.g. [{a,1},{a,2}] -> [{a,3}]) and cap the
 * merged quantity at 99 per product, matching the API contract.
 */
function normalizeItems(items: CartItemInput[]): CartItemInput[] {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  return [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity: Math.min(quantity, 99),
  }));
}

/**
 * Price a cart. Throws QuoteError when a product id or shipping option id
 * is unknown. Never trusts any price sent by the client.
 */
export function quoteCart(
  rawItems: CartItemInput[],
  shippingOptionId: string,
): CartQuote {
  if (rawItems.length === 0) {
    throw new QuoteError("Your cart is empty.");
  }

  const shippingOption = getShippingOptionById(shippingOptionId);
  if (!shippingOption) {
    throw new QuoteError("Please choose a valid shipping option.");
  }

  const items: QuoteLine[] = [];
  let subtotalInCents = 0;

  for (const { productId, quantity } of normalizeItems(rawItems)) {
    const product: Product | undefined = getProductById(productId);
    if (!product) {
      throw new QuoteError(`Unknown product: ${productId}`);
    }
    const lineTotalInCents = product.priceInCents * quantity;
    subtotalInCents += lineTotalInCents;
    items.push({
      productId: product.id,
      name: product.name,
      quantity,
      unitAmountInCents: product.priceInCents,
      lineTotalInCents,
    });
  }

  const shippingInCents = shippingOption.amountInCents;

  return {
    items,
    subtotalInCents,
    shippingInCents,
    totalInCents: subtotalInCents + shippingInCents,
    currency: "usd",
    shippingOption,
  };
}

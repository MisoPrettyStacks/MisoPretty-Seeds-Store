/**
 * STRIPE CLIENT
 * ----------------------------------------------------------------------------
 * Keys are read ONLY from environment variables — never hardcoded.
 *
 *   STRIPE_SECRET_KEY        Secret key, e.g. sk_test_... (TEST MODE while
 *                            building; swap to sk_live_... when ready for
 *                            real payments)
 *   STRIPE_PUBLISHABLE_KEY   Publishable key, e.g. pk_test_...
 *                            (only needed if you later add Stripe Payment
 *                            Elements on a custom card form; the current
 *                            Stripe Checkout redirect flow does NOT need it
 *                            in the browser)
 *
 * WHERE TO PASTE LIVE KEYS WHEN READY
 * ------------------------------------
 * When you've finished Stripe's identity + bank verification and want to
 * accept REAL payments:
 *   1. In the Stripe Dashboard, toggle from "Test mode" to "Live mode".
 *   2. Copy your LIVE secret key (starts with sk_live_) and set it as the
 *      STRIPE_SECRET_KEY environment variable on your host.
 *   3. (Only if using Payment Elements later) copy the live publishable
 *      key (pk_live_...) into STRIPE_PUBLISHABLE_KEY.
 *   4. Redeploy. No code changes needed — the same variable names are used.
 *
 * Until STRIPE_SECRET_KEY is set, the /store/checkout endpoint answers
 * 503 "Checkout is temporarily unavailable" instead of crashing.
 */

import Stripe from "stripe";
import { logger } from "./logger";

let stripeInstance: Stripe | null = null;
let warnedMissing = false;

/** Returns the configured Stripe client, or null when no secret key is set. */
export function getStripe(): Stripe | null {
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) {
    if (!warnedMissing) {
      logger.warn(
        "STRIPE_SECRET_KEY is not set — /store/checkout will return 503. " +
          "Add your Stripe test key to enable checkout.",
      );
      warnedMissing = true;
    }
    return null;
  }
  if (!stripeInstance) {
    // No explicit apiVersion: the SDK negotiates its bundled default.
    stripeInstance = new Stripe(secretKey);
  }
  return stripeInstance;
}

/** True when the secret key looks like a TEST key (starts with sk_test_). */
export function isTestMode(): boolean {
  return (process.env["STRIPE_SECRET_KEY"] ?? "").startsWith("sk_test_");
}

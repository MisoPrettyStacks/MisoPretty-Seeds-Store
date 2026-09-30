/**
 * SHIPPING OPTIONS
 * ----------------------------------------------------------------------------
 * Flat-rate US shipping choices shown at checkout. These amounts are CONFIGURE
 * examples — update them to match your real postage costs before launch.
 * Like products, shipping prices live ONLY on the server; the browser just
 * sends the option id and the server applies the amount.
 */

export interface ShippingOption {
  /** Stable id the cart/checkout sends, e.g. "standard". */
  id: string;
  name: string;
  description: string;
  /** Flat rate in cents. $3.99 = 399. */
  amountInCents: number;
  deliveryEstimate: string;
}

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "USPS First-Class Mail, tracked",
    amountInCents: 399,
    deliveryEstimate: "5–7 business days",
  },
  {
    id: "priority",
    name: "Priority Shipping",
    description: "USPS Priority Mail, tracked",
    amountInCents: 799,
    deliveryEstimate: "2–3 business days",
  },
];

/** Look up a shipping option by id. Returns undefined for unknown ids. */
export function getShippingOptionById(id: string): ShippingOption | undefined {
  return SHIPPING_OPTIONS.find((o) => o.id === id);
}

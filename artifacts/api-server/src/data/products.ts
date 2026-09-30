/**
 * SERVER-OWNED PRODUCT CATALOG
 * ----------------------------------------------------------------------------
 * This file is the single source of truth for every product and price in the
 * shop. The browser NEVER sends prices to the server — the /store/quote
 * endpoint re-prices every cart from this list, so a shopper can't tamper
 * with totals in devtools.
 *
 * To change a price, name, or description, edit it here and redeploy.
 * Product images live in the storefront's public/images/ folder.
 */

export interface Product {
  /** Stable slug the cart uses to identify this product (never change it). */
  id: string;
  name: string;
  /** Keep descriptions plain and practical — no poetic flourishes. */
  description: string;
  /** Price in cents. $4.99 = 499. */
  priceInCents: number;
  currency: "usd";
  /** Path served by the storefront, e.g. "/images/cosmos.jpg". */
  imageUrl: string;
  /** e.g. "Approx. 50 seeds" */
  seedCount: string;
  /** Short, practical growing tip. */
  growingNotes: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "common-sunflower",
    name: "Common Sunflower",
    description: "Tall, classic yellow blooms. Easy to grow.",
    priceInCents: 499,
    currency: "usd",
    imageUrl: "/images/common-sunflower.jpg",
    seedCount: "Approx. 50 seeds",
    growingNotes: "Sow after last frost in full sun.",
  },
  {
    id: "cosmos",
    name: "Cosmos",
    description: "Delicate flowers that bloom all summer long.",
    priceInCents: 499,
    currency: "usd",
    imageUrl: "/images/cosmos.jpg",
    seedCount: "Approx. 50 seeds",
    growingNotes: "Sow after last frost in full sun.",
  },
  {
    id: "mammoth-sunflower",
    name: "Mammoth Sunflower",
    description: "Grows up to 10 feet tall. A real garden statement.",
    priceInCents: 499,
    currency: "usd",
    imageUrl: "/images/mammoth-sunflower.jpg",
    seedCount: "Approx. 25 seeds",
    growingNotes: "Sow after last frost in full sun.",
  },
  {
    id: "nasturtium",
    name: "Nasturtium",
    description: "Bright, edible flowers. Very easy to grow.",
    priceInCents: 499,
    currency: "usd",
    imageUrl: "/images/nasturtium.jpg",
    seedCount: "Approx. 25 seeds",
    growingNotes: "Sow after last frost in full sun.",
  },
  {
    id: "poppy",
    name: "Poppy",
    description: "Beautiful papery blooms. Self-seeds for next year.",
    priceInCents: 499,
    currency: "usd",
    imageUrl: "/images/poppy.jpg",
    seedCount: "Approx. 200 seeds",
    growingNotes: "Sow in fall or early spring.",
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Fragrant purple blooms. Loved by bees.",
    priceInCents: 499,
    currency: "usd",
    imageUrl: "/images/lavender.jpg",
    seedCount: "Approx. 50 seeds",
    growingNotes: "Start indoors 8 weeks before last frost.",
  },
  {
    id: "mystery-1",
    name: "Flower (Mystery Variety 1)",
    description: "New variety coming soon.",
    priceInCents: 499,
    currency: "usd",
    imageUrl: "/images/flower-mystery-1.jpg",
    seedCount: "Details coming soon",
    growingNotes: "Growing notes coming soon.",
  },
  {
    id: "mystery-2",
    name: "Flower (Mystery Variety 2)",
    description: "New variety coming soon.",
    priceInCents: 499,
    currency: "usd",
    imageUrl: "/images/flower-mystery-2.jpg",
    seedCount: "Details coming soon",
    growingNotes: "Growing notes coming soon.",
  },
];

/** Look up a product by its cart slug. Returns undefined for unknown ids. */
export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

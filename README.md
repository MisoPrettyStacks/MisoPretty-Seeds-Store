# MisoPretty Seeds — Ecommerce Store

A complete seed shop: a React storefront (Vite + Tailwind + Framer Motion) and a
Node/Express API that serves the site and handles checkout through Stripe.

**Brand:** MisoPretty Seeds — feminine, modern, lightly glittery. Pure white,
sage `#7a8b5c`, dusty rose `#c08a94`, charcoal `#333`.

**Catalog:** 8 seed varieties, all **$4.99** per packet, with product photos in
`artifacts/misopretty-seeds/public/images/` (public-domain / CC0, safe for
commercial use).

## Quick start

```bash
pnpm install

# 1. Build the storefront
cd artifacts/misopretty-seeds
PORT=5173 BASE_PATH=/ pnpm run build
cd ../..

# 2. Configure the server (see artifacts/api-server/.env.example)
cp artifacts/api-server/.env.example artifacts/api-server/.env
# edit .env and add your Stripe test secret key

# 3. Build and run the server
cd artifacts/api-server
pnpm run build
PORT=5000 node --enable-source-maps ./dist/index.mjs
```

Open `http://localhost:5000`. The server serves the built site and the API at
`/api`.

**Local dev (hot reload):** run the API on port 5000, then in another terminal
run the frontend with `PORT=5173 BASE_PATH=/ pnpm run dev` — Vite proxies
`/api` calls to the API server.

## Environment variables

All server settings live in `artifacts/api-server/.env`:

| Variable               | Required | Purpose                                            |
|------------------------|----------|----------------------------------------------------|
| `PORT`                 | no       | Server port (default `5000`)                       |
| `STRIPE_SECRET_KEY`    | **yes**  | Stripe secret key. Without it, checkout returns a friendly "unavailable" message instead of crashing. |
| `STRIPE_PUBLISHABLE_KEY` | no     | Documented for reference; not used by the frontend because checkout uses Stripe's hosted page. |

The frontend takes no secrets — it never sees the Stripe secret key.

## API endpoints

All under `/api/store`:

| Method | Path                      | What it does                                   |
|--------|---------------------------|------------------------------------------------|
| GET    | `/api/store/products`     | Product catalog (server-owned)                 |
| GET    | `/api/store/shipping-options` | Shipping methods (server-owned)            |
| POST   | `/api/store/quote`        | Calculate cart totals from server prices       |
| POST   | `/api/store/checkout`     | Create a Stripe Checkout session               |
| GET    | `/api/store/checkout/:sessionId` | Confirm a paid order (only after Stripe says paid) |

The client never sets prices. The server owns the catalog, validates every
product and shipping ID, merges duplicate line items, caps quantity at 99, and
builds the Stripe session from its own data.

## Payments (Stripe)

Checkout uses **Stripe's hosted Checkout page** — customers enter card details
on stripe.com, never on this site.

- In test mode, use test keys (`sk_test_...`) and Stripe's test card numbers.
- The confirmation endpoint only returns an order when Stripe reports the
  session as `paid`.
- **Going live checklist:**
  1. Finish identity verification in your own Stripe account.
  2. Toggle **Test mode OFF** in the Stripe dashboard.
  3. Put your **live** keys (`sk_live_...` / `pk_live_...`) in the hosting
     provider's environment settings — never commit them to git.
  4. Do one real test purchase with a real card, then refund it.

## Shipping rates

⚠️ **Check before launch.** The rates in `artifacts/api-server/src/data/shipping.ts`
are placeholders:

- Standard: **$3.99**, 5–7 business days
- Priority: **$7.99**, 2–3 business days

Seed packets ship in a standard envelope — compare actual USPS rates for your
packaging before going live and update `shipping.ts` (and rebuild).

## Hosting

This project needs a **Node.js host** (the server runs the API + Stripe +
static site). It cannot run on GitHub Pages alone — Pages can only serve static
files, not the checkout server.

Good options: Render, Railway, Fly.io, or a VPS. Set the environment variables
in the host's dashboard, run the build commands above, and start with
`PORT=<host-provided> node dist/index.mjs`.

## Contact

The storefront's contact email is a placeholder (`hello@misoprettyseeds.com`).
Replace it in `artifacts/misopretty-seeds/src/components/site-footer.tsx` and
`src/pages/home.tsx` with a real address before launch.

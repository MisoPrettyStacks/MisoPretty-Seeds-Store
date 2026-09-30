/**
 * Checkout — customer info + shipping choice + server-validated totals,
 * then off to Stripe Checkout for secure payment.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Lock,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";
import {
  useCreateCheckoutSession,
  useGetCartQuote,
  useListShippingOptions,
  useListStoreProducts,
  type StoreProduct,
} from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"],
  ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"],
  ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
  ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

interface FormState {
  name: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-charcoal">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function CheckoutPage() {
  const { lines } = useCart();
  const [, navigate] = useLocation();

  const productsQuery = useListStoreProducts();
  const shippingQuery = useListShippingOptions();
  const quoteMutation = useGetCartQuote();
  const checkoutMutation = useCreateCheckoutSession();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({});
  const [shippingOptionId, setShippingOptionId] = useState("standard");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const productIndex = useMemo(() => {
    const map = new Map<string, StoreProduct>();
    for (const p of productsQuery.data ?? []) map.set(p.id, p);
    return map;
  }, [productsQuery.data]);

  const options = shippingQuery.data;
  useEffect(() => {
    if (options && options.length > 0 && !options.some((o) => o.id === shippingOptionId)) {
      setShippingOptionId(options[0].id);
    }
  }, [options, shippingOptionId]);

  // Server-validated totals for this cart + shipping choice.
  useEffect(() => {
    if (lines.length === 0) return;
    quoteMutation.mutate({
      data: {
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        shippingOptionId,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, shippingOptionId]);

  const quote = quoteMutation.data;

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  function validate(): boolean {
    const errs: Partial<FormState> = {};
    if (form.name.trim().length < 2) errs.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Please enter a valid email address.";
    if (form.line1.trim().length < 3)
      errs.line1 = "Please enter your street address.";
    if (form.city.trim().length < 2) errs.city = "Please enter your city.";
    if (!form.state) errs.state = "Select a state.";
    if (!/^\d{5}(-\d{4})?$/.test(form.postalCode.trim()))
      errs.postalCode = "Enter a valid ZIP code (e.g. 90210).";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate() || !quote) return;

    checkoutMutation.mutate(
      {
        data: {
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
          shippingOptionId,
          customer: { name: form.name.trim(), email: form.email.trim() },
          address: {
            line1: form.line1.trim(),
            line2: form.line2.trim() || null,
            city: form.city.trim(),
            state: form.state,
            postalCode: form.postalCode.trim(),
            country: "US",
          },
        },
      },
      {
        onSuccess: (session) => {
          // Hand off to Stripe's hosted, PCI-compliant checkout page.
          window.location.href = session.checkoutUrl;
        },
        onError: (err) => {
          // The generated API client throws an ApiError whose parsed
          // response body lives on `err.data` (e.g. { error: "..." }).
          const data =
            err && typeof err === "object"
              ? (err as { data?: unknown }).data
              : undefined;
          const serverMessage =
            data && typeof data === "object"
              ? (data as { error?: unknown }).error
              : undefined;
          const message =
            typeof serverMessage === "string" && serverMessage.trim()
              ? serverMessage
              : "We couldn't start checkout. Please try again.";
          setSubmitError(message);
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
      },
    );
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-rose-pale text-rose-deep">
          <ShoppingBag className="size-7" />
        </span>
        <h1 className="mt-6 font-display text-4xl font-semibold text-charcoal">
          Your cart is empty
        </h1>
        <p className="mt-3 text-charcoal/60">
          Add some seeds first — checkout will be waiting.
        </p>
        <Button
          asChild
          className="mt-6 rounded-full bg-sage text-white hover:bg-sage-dark"
        >
          <Link href="/#shop">Browse seeds</Link>
        </Button>
      </main>
    );
  }

  const placing = checkoutMutation.isPending;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <button
        onClick={() => navigate("/")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal/60 hover:text-sage-dark"
      >
        <ArrowLeft className="size-4" /> Back to the shop
      </button>

      <h1 className="font-display text-4xl font-semibold text-charcoal sm:text-5xl">
        Checkout
      </h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-charcoal/55">
        <Lock className="size-3.5 text-sage" /> Secure checkout — payment is
        handled by Stripe.
      </p>

      {submitError && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-charcoal">{submitError}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]"
      >
        <div className="space-y-8">
          {/* Contact */}
          <section className="rounded-2xl border border-charcoal/10 bg-white p-6">
            <h2 className="font-display text-2xl font-semibold text-charcoal">
              Who's ordering?
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field id="name" label="Full name" error={fieldErrors.name}>
                <Input
                  id="name"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Jane Gardener"
                  autoComplete="name"
                  maxLength={120}
                />
              </Field>
              <Field id="email" label="Email" error={fieldErrors.email}>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="jane@example.com"
                  autoComplete="email"
                  maxLength={254}
                />
              </Field>
            </div>
          </section>

          {/* Shipping address */}
          <section className="rounded-2xl border border-charcoal/10 bg-white p-6">
            <h2 className="font-display text-2xl font-semibold text-charcoal">
              Where are the seeds going?
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="line1" label="Street address" error={fieldErrors.line1}>
                  <Input
                    id="line1"
                    value={form.line1}
                    onChange={set("line1")}
                    placeholder="123 Garden Lane"
                    autoComplete="street-address"
                    maxLength={200}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="line2" label="Apt, suite, etc. (optional)">
                  <Input
                    id="line2"
                    value={form.line2}
                    onChange={set("line2")}
                    placeholder="Apt 4B"
                    autoComplete="address-line2"
                    maxLength={200}
                  />
                </Field>
              </div>
              <Field id="city" label="City" error={fieldErrors.city}>
                <Input
                  id="city"
                  value={form.city}
                  onChange={set("city")}
                  placeholder="Fresno"
                  autoComplete="address-level2"
                  maxLength={100}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field id="state" label="State" error={fieldErrors.state}>
                  <select
                    id="state"
                    value={form.state}
                    onChange={set("state")}
                    autoComplete="address-level1"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select</option>
                    {US_STATES.map(([abbr, name]) => (
                      <option key={abbr} value={abbr}>
                        {name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="postalCode" label="ZIP code" error={fieldErrors.postalCode}>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={set("postalCode")}
                    placeholder="93721"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Shipping method */}
          <section className="rounded-2xl border border-charcoal/10 bg-white p-6">
            <h2 className="font-display text-2xl font-semibold text-charcoal">
              Shipping method
            </h2>
            <div className="mt-4 space-y-2" role="radiogroup" aria-label="Shipping method">
              {shippingQuery.isPending ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : shippingQuery.isError || !options ? (
                <p className="text-sm text-destructive">
                  Couldn't load shipping options. Please refresh and try again.
                </p>
              ) : (
                options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
                      shippingOptionId === opt.id
                        ? "border-sage bg-sage-pale/60"
                        : "border-charcoal/10 hover:border-sage/40"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="ship-method"
                        checked={shippingOptionId === opt.id}
                        onChange={() => setShippingOptionId(opt.id)}
                        className="accent-[#7a8b5c]"
                      />
                      <span>
                        <span className="block font-medium text-charcoal">
                          {opt.name}
                        </span>
                        <span className="block text-xs text-charcoal/55">
                          {opt.description} · {opt.deliveryEstimate}
                        </span>
                      </span>
                    </span>
                    <span className="font-bold text-sage-dark">
                      {formatCents(opt.amountInCents)}
                    </span>
                  </label>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6">
            <h2 className="font-display text-2xl font-semibold text-charcoal">
              Order summary
            </h2>
            <ul className="mt-4 space-y-3">
              {lines.map((line) => {
                const p = productIndex.get(line.productId);
                return (
                  <li key={line.productId} className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-rose-pale/40">
                      {p && (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="size-full object-cover"
                        />
                      )}
                      <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-lg bg-charcoal/80 text-[10px] font-bold text-white">
                        {line.quantity}
                      </span>
                    </div>
                    <span className="flex-1 text-sm font-medium text-charcoal">
                      {p?.name ?? line.productId}
                    </span>
                    <span className="text-sm font-semibold text-charcoal">
                      {p ? formatCents(p.priceInCents * line.quantity) : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>

            <Separator className="my-4" />

            {quoteMutation.isPending || !quote ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-charcoal/60">Subtotal</dt>
                  <dd className="font-medium">
                    {formatCents(quote.subtotalInCents)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-charcoal/60">Shipping</dt>
                  <dd className="font-medium">
                    {formatCents(quote.shippingInCents)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-charcoal/8 pt-2 text-base">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-bold text-sage-dark">
                    {formatCents(quote.totalInCents)}
                  </dd>
                </div>
              </dl>
            )}

            <Button
              type="submit"
              disabled={placing || !quote}
              className="mt-6 w-full rounded-full bg-sage py-6 text-base text-white hover:bg-sage-dark"
            >
              {placing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="size-4" /> Pay{" "}
                  {quote ? formatCents(quote.totalInCents) : ""} with Stripe
                </>
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-charcoal/45">
              You'll complete payment on Stripe's secure page. Totals are
              verified by our server.
            </p>
          </div>
        </aside>
      </form>
    </main>
  );
}

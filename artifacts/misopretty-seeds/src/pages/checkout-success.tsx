/**
 * Checkout success — confirms a paid Stripe session and shows the order.
 * The cart is cleared once payment is confirmed.
 */
import { useEffect, useMemo } from "react";
import { Link, useSearch } from "wouter";
import {
  CheckCircle2,
  Loader2,
  PartyPopper,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import {
  getGetCheckoutConfirmationQueryKey,
  useGetCheckoutConfirmation,
} from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function CheckoutSuccessPage() {
  const search = useSearch();
  const sessionId = useMemo(() => {
    return new URLSearchParams(search).get("session_id");
  }, [search]);

  const { clear } = useCart();
  const confirmation = useGetCheckoutConfirmation(sessionId ?? "", {
    query: {
      queryKey: getGetCheckoutConfirmationQueryKey(sessionId ?? ""),
      enabled: !!sessionId,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  });

  // Empty the cart once Stripe confirms payment — one less thing to do by hand.
  useEffect(() => {
    if (confirmation.data?.status === "paid") clear();
  }, [confirmation.data?.status, clear]);

  if (!sessionId) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <TriangleAlert className="mx-auto size-10 text-rose-deep" />
        <h1 className="mt-4 font-display text-4xl font-semibold text-charcoal">
          No order found
        </h1>
        <p className="mt-3 text-charcoal/60">
          This page needs a checkout session to show. If you just paid, check
          your email for the receipt.
        </p>
        <Button asChild className="mt-6 rounded-full bg-sage text-white hover:bg-sage-dark">
          <Link href="/">Back to the shop</Link>
        </Button>
      </main>
    );
  }

  if (confirmation.isPending) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin text-sage" />
          <h1 className="font-display text-4xl font-semibold text-charcoal">
            Confirming your order…
          </h1>
          <p className="text-charcoal/60">
            Just a moment while we check with Stripe.
          </p>
          <div className="w-full max-w-md space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </main>
    );
  }

  if (confirmation.isError) {
    const apiMessage = (
      confirmation.error as { error?: { error?: string } }
    )?.error?.error;
    const notPaidYet = apiMessage?.toLowerCase().includes("not paid");
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        {notPaidYet ? (
          <Loader2 className="mx-auto size-10 animate-spin text-sage" />
        ) : (
          <TriangleAlert className="mx-auto size-10 text-rose-deep" />
        )}
        <h1 className="mt-4 font-display text-4xl font-semibold text-charcoal">
          {notPaidYet ? "Almost there…" : "We couldn't find that order"}
        </h1>
        <p className="mt-3 text-charcoal/60">
          {notPaidYet
            ? "Stripe hasn't marked this checkout as paid yet. Give it a few seconds, then refresh."
            : (apiMessage ??
              "Something went wrong looking up your order. Your receipt email from Stripe is the source of truth.")}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            onClick={() => confirmation.refetch()}
            variant="outline"
            className="rounded-full"
          >
            <RefreshCw className="size-4" /> Check again
          </Button>
          <Button asChild className="rounded-full bg-sage text-white hover:bg-sage-dark">
            <Link href="/">Back to the shop</Link>
          </Button>
        </div>
      </main>
    );
  }

  const order = confirmation.data;

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="rounded-3xl border border-charcoal/10 bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage-pale text-sage-dark">
          <PartyPopper className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-4xl font-semibold text-charcoal sm:text-5xl">
          Thank you!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-charcoal/65">
          Your order is confirmed and your seeds will be packed by hand soon.
          A receipt is on its way to{" "}
          <strong className="text-charcoal">{order.email}</strong>.
        </p>

        <div className="mt-8 rounded-2xl bg-sage-pale/50 p-6 text-left">
          <p className="flex items-center gap-2 text-sm font-semibold text-sage-dark">
            <CheckCircle2 className="size-4" /> Order confirmed
          </p>
          <ul className="mt-4 space-y-2">
            {order.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-charcoal">
                  {item.name}{" "}
                  <span className="text-charcoal/50">× {item.quantity}</span>
                </span>
                <span className="font-semibold text-charcoal">
                  {formatCents(item.lineTotalInCents)}
                </span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-charcoal/60">Subtotal</dt>
              <dd className="font-medium">{formatCents(order.subtotalInCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-charcoal/60">Shipping</dt>
              <dd className="font-medium">{formatCents(order.shippingInCents)}</dd>
            </div>
            <div className="flex justify-between pt-1 text-base">
              <dt className="font-semibold">Total paid</dt>
              <dd className="font-bold text-sage-dark">
                {formatCents(order.totalInCents)}
              </dd>
            </div>
          </dl>
        </div>

        <Button
          asChild
          className="mt-8 rounded-full bg-sage px-8 text-white hover:bg-sage-dark"
        >
          <Link href="/#shop">Keep shopping</Link>
        </Button>
      </div>
    </main>
  );
}

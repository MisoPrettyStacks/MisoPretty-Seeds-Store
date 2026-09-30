/**
 * CartDrawer — slide-out cart with SERVER-validated totals.
 * The drawer asks POST /api/store/quote for totals every time the cart or
 * shipping choice changes, so the numbers shown always match the server.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import {
  useGetCartQuote,
  useListShippingOptions,
  useListStoreProducts,
  type StoreProduct,
} from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

function useProductIndex(products: StoreProduct[] | undefined) {
  return useMemo(() => {
    const map = new Map<string, StoreProduct>();
    for (const p of products ?? []) map.set(p.id, p);
    return map;
  }, [products]);
}

export function CartDrawer() {
  const {
    lines,
    isDrawerOpen,
    closeDrawer,
    setQuantity,
    remove,
  } = useCart();

  const productsQuery = useListStoreProducts();
  const shippingQuery = useListShippingOptions();
  const quoteMutation = useGetCartQuote();
  const productIndex = useProductIndex(productsQuery.data);

  const [shippingOptionId, setShippingOptionId] = useState<string>("standard");
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const options = shippingQuery.data;
  useEffect(() => {
    if (options && options.length > 0 && !options.some((o) => o.id === shippingOptionId)) {
      setShippingOptionId(options[0].id);
    }
  }, [options, shippingOptionId]);

  // Re-quote on the server whenever the cart or shipping choice changes.
  useEffect(() => {
    if (!isDrawerOpen || lines.length === 0) return;
    setQuoteError(null);
    quoteMutation.mutate(
      {
        data: {
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
          shippingOptionId,
        },
      },
      {
        onError: (err) => {
          const msg =
            (err as { error?: { error?: string } })?.error?.error ??
            "Couldn't load your totals. Please try again.";
          setQuoteError(msg);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen, lines, shippingOptionId]);

  const quote = quoteMutation.data;
  const quoting = quoteMutation.isPending;

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl text-charcoal">
            Your cart
          </SheetTitle>
          <SheetDescription>
            {lines.length === 0
              ? "Nothing here yet — let's fix that."
              : "Totals are confirmed by our server before checkout."}
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-rose-pale text-rose-deep">
              <ShoppingBag className="size-7" />
            </span>
            <p className="max-w-[26ch] text-sm text-charcoal/60">
              Your cart is empty. Every packet is $4.99 and ships with care.
            </p>
            <Button
              onClick={closeDrawer}
              className="rounded-full bg-sage text-white hover:bg-sage-dark"
            >
              Browse seeds
            </Button>
          </div>
        ) : (
          <>
            <div className="-mx-6 flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-4">
                {lines.map((line) => {
                  const product = productIndex.get(line.productId);
                  return (
                    <li key={line.productId} className="flex gap-3">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-rose-pale/40">
                        {product && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="size-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-charcoal">
                            {product?.name ?? line.productId}
                          </p>
                          <button
                            onClick={() => remove(line.productId)}
                            className="text-charcoal/40 transition-colors hover:text-destructive"
                            aria-label={`Remove ${product?.name ?? line.productId}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center rounded-full border border-charcoal/15">
                            <button
                              onClick={() =>
                                setQuantity(line.productId, line.quantity - 1)
                              }
                              className="grid size-7 place-items-center rounded-full hover:bg-charcoal/5"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-semibold">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() =>
                                setQuantity(line.productId, line.quantity + 1)
                              }
                              className="grid size-7 place-items-center rounded-full hover:bg-charcoal/5"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-sage-dark">
                            {product
                              ? formatCents(product.priceInCents * line.quantity)
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <Separator className="my-4" />

              {/* Shipping choice */}
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-charcoal">
                  <Truck className="size-4 text-sage" /> Shipping
                </p>
                {shippingQuery.isPending ? (
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : shippingQuery.isError || !options ? (
                  <p className="text-sm text-destructive">
                    Couldn't load shipping options. Please try again.
                  </p>
                ) : (
                  <div className="space-y-2" role="radiogroup" aria-label="Shipping method">
                    {options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm transition-colors ${
                          shippingOptionId === opt.id
                            ? "border-sage bg-sage-pale/60"
                            : "border-charcoal/10 hover:border-sage/40"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingOptionId === opt.id}
                            onChange={() => setShippingOptionId(opt.id)}
                            className="accent-[#7a8b5c]"
                          />
                          <span>
                            <span className="block font-medium text-charcoal">
                              {opt.name}
                            </span>
                            <span className="block text-xs text-charcoal/55">
                              {opt.deliveryEstimate}
                            </span>
                          </span>
                        </span>
                        <span className="font-bold text-sage-dark">
                          {formatCents(opt.amountInCents)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <SheetFooter className="flex-col gap-3 border-t border-charcoal/8 pt-4 sm:flex-col">
              {quoteError ? (
                <p className="text-center text-sm text-destructive">{quoteError}</p>
              ) : quoting || !quote ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <dl className="w-full space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-charcoal/60">Subtotal</dt>
                    <dd className="font-medium">
                      {formatCents(quote.subtotalInCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-charcoal/60">
                      Shipping ({quote.shippingOption.name})
                    </dt>
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

              <Link href="/checkout" className="w-full" onClick={closeDrawer}>
                <Button
                  className="w-full rounded-full bg-sage py-6 text-base text-white hover:bg-sage-dark"
                  disabled={quoting || !quote}
                >
                  {quoting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Continue to checkout <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </Link>
              <p className="text-center text-xs text-charcoal/45">
                Secure checkout with Stripe · Totals verified by our server
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

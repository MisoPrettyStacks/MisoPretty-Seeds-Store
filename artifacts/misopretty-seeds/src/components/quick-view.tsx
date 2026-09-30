/** Quick-view dialog: bigger photo, seed count, growing notes, add-to-cart. */
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { StoreProduct } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function QuickView({
  product,
  onClose,
}: {
  product: StoreProduct | null;
  onClose: () => void;
}) {
  const { add, openDrawer } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (!product) return;
    add(product.id, quantity);
    setQuantity(1);
    onClose();
    openDrawer();
  };

  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden rounded-2xl p-0">
        {product && (
          <div className="grid sm:grid-cols-2">
            <div className="aspect-square bg-rose-pale/40 sm:aspect-auto sm:min-h-full">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-col p-6">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-semibold text-charcoal">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-charcoal/60">
                  {product.description}
                </DialogDescription>
              </DialogHeader>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal/50">Seeds per packet</dt>
                  <dd className="font-medium text-charcoal">{product.seedCount}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal/50">Growing notes</dt>
                  <dd className="text-right font-medium text-charcoal">
                    {product.growingNotes}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal/50">Price</dt>
                  <dd className="text-lg font-bold text-sage-dark">
                    {formatCents(product.priceInCents)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-charcoal/15">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleAdd}
                  className="flex-1 rounded-full bg-sage text-white hover:bg-sage-dark"
                >
                  <ShoppingBag className="size-4" /> Add to cart
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

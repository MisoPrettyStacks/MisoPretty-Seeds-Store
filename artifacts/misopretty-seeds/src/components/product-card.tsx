/**
 * ProductCard — catalog tile with a subtle 3D tilt on hover.
 * Tilt is pointer-driven and disabled on touch devices automatically
 * (no hover = no tilt), keeping it fast on mobile.
 */
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Plus } from "lucide-react";
import type { StoreProduct } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MAX_TILT = 7;

export function ProductCard({
  product,
  onQuickView,
}: {
  product: StoreProduct;
  onQuickView: (product: StoreProduct) => void;
}) {
  const { add, openDrawer } = useCart();
  const frameRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -py * MAX_TILT, ry: px * MAX_TILT });
  };

  const reset = () => setTilt({ rx: 0, ry: 0 });

  const handleAdd = () => {
    add(product.id, 1);
    openDrawer();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="perspective-1000"
    >
      <div
        ref={frameRef}
        onPointerMove={handleMove}
        onPointerLeave={reset}
        className="preserve-3d group overflow-hidden rounded-2xl border border-charcoal/8 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: "transform 0.15s ease-out",
        }}
      >
        <button
          onClick={() => onQuickView(product)}
          className="relative block w-full cursor-pointer"
          aria-label={`Quick view ${product.name}`}
        >
          <div className="aspect-square overflow-hidden bg-rose-pale/40">
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          {product.id.startsWith("mystery") && (
            <Badge className="absolute left-3 top-3 rounded-full bg-rose/90 text-white hover:bg-rose">
              Coming soon
            </Badge>
          )}
          <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-1.5 bg-white/85 py-2 text-xs font-semibold text-sage-dark opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Eye className="size-3.5" /> Quick view
          </span>
        </button>

        <div className="p-4">
          <h3 className="font-display text-xl font-semibold leading-tight text-charcoal">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-charcoal/60">
            {product.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-sage-dark">
              {formatCents(product.priceInCents)}
            </span>
            <Button
              size="sm"
              onClick={handleAdd}
              className="rounded-full bg-sage px-4 text-white hover:bg-sage-dark"
            >
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

import { Link, useLocation } from "wouter";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Shop", href: "/#shop" },
  { label: "About", href: "/#about" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

export function SiteHeader() {
  const { count, openDrawer } = useCart();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-rose-pale bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-sage-pale text-sage-dark transition-transform group-hover:rotate-12">
            <Sparkles className="size-4" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-wide text-charcoal">
            MisoPretty Seeds
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-charcoal/70 transition-colors hover:text-sage-dark"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {location !== "/checkout" && (
            <Button
              variant="outline"
              size="sm"
              onClick={openDrawer}
              className={cn(
                "relative rounded-full border-sage/30 text-sage-dark hover:bg-sage-pale",
              )}
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-rose text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

import { useState } from "react";
import {
  Leaf,
  Loader2,
  Lock,
  Mail,
  Package,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  useListStoreProducts,
  type StoreProduct,
} from "@workspace/api-client-react";
import { PetalField } from "@/components/petal-field";
import { ProductCard } from "@/components/product-card";
import { QuickView } from "@/components/quick-view";
import { Reveal } from "@/components/reveal";
import { CONTACT_EMAIL } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <PetalField />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <span className="animate-drift mb-6 inline-flex items-center gap-1.5 rounded-full bg-rose-pale px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-rose-deep">
          <Sparkles className="size-3.5" /> Small-batch flower seeds
        </span>
        <h1 className="text-balance font-display text-5xl font-semibold leading-[1.05] text-charcoal sm:text-7xl">
          Pretty seeds for
          <br />
          <em className="text-sage-dark">pretty gardens</em>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-charcoal/65">
          Eight easy-to-grow flower varieties, packed by hand and shipped with
          care. Every packet is <strong className="text-charcoal">$4.99</strong> —
          no surprises, just flowers.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-sage px-8 text-white hover:bg-sage-dark"
          >
            <a href="#shop">Shop seeds</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-rose/40 text-rose-deep hover:bg-rose-pale"
          >
            <a href="#about">Our story</a>
          </Button>
        </div>

        <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Package, title: "Packed by hand", text: "Small batches, checked twice" },
            { icon: Leaf, title: "Easy to grow", text: "Beginner-friendly varieties" },
            { icon: Lock, title: "Secure checkout", text: "Encrypted payments via Stripe" },
          ].map((b) => (
            <div
              key={b.title}
              className="flex items-center gap-3 rounded-2xl border border-charcoal/8 bg-white/70 p-4 text-left backdrop-blur-sm"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-pale text-sage-dark">
                <b.icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-charcoal">
                  {b.title}
                </span>
                <span className="block text-xs text-charcoal/55">{b.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShopSection() {
  const productsQuery = useListStoreProducts();
  const [quickView, setQuickView] = useState<StoreProduct | null>(null);

  return (
    <section id="shop" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-deep">
            The collection
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold text-charcoal sm:text-5xl">
            Shop seeds
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-charcoal/60">
            Eight flower varieties at one simple price. Tap any packet for
            growing notes and seed counts.
          </p>
        </Reveal>

        {productsQuery.isPending && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4" aria-label="Loading products">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {productsQuery.isError && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-charcoal/10 bg-white p-10 text-center">
            <p className="font-display text-2xl text-charcoal">
              The seed shelf is stuck
            </p>
            <p className="text-sm text-charcoal/60">
              We couldn't load the catalog just now. Check your connection and
              try again.
            </p>
            <Button
              onClick={() => productsQuery.refetch()}
              variant="outline"
              className="rounded-full"
            >
              <RefreshCw className="size-4" /> Try again
            </Button>
          </div>
        )}

        {productsQuery.data && productsQuery.data.length === 0 && (
          <p className="text-center text-charcoal/60">
            No seeds available right now — check back soon.
          </p>
        )}

        {productsQuery.data && productsQuery.data.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {productsQuery.data.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickView}
              />
            ))}
          </div>
        )}
      </div>

      <QuickView product={quickView} onClose={() => setQuickView(null)} />
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 bg-sage-pale/50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-deep">
            About
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold text-charcoal sm:text-5xl">
            Grown with glitter
          </h2>
          <div className="mx-auto mt-6 max-w-2xl space-y-4 text-left text-charcoal/70">
            <p>
              MisoPretty Seeds is a one-woman flower seed business, grown from
              a small home garden and a big love of pretty things. Every
              variety in the shop is one I actually grow — if it doesn't earn
              its place in my garden, it doesn't make it into a packet.
            </p>
            <p>
              Seeds are packed by hand in small batches, so what you receive
              is fresh and ready to sow. No warehouse, no middlemen — just
              seeds from a gardener who wants your garden to look amazing.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "How long does shipping take?",
    a: "Standard shipping arrives in 5–7 business days; priority arrives in 2–3 business days. Every order is tracked, and packets go out within 2 business days of ordering.",
  },
  {
    q: "How do I pay?",
    a: "Checkout is handled securely by Stripe — we accept all major credit and debit cards. Your card details never touch our servers.",
  },
  {
    q: "When should I plant these seeds?",
    a: "Most varieties in the shop are sown after your last frost in full sun. Each packet's quick view lists simple growing notes to get you started.",
  },
  {
    q: "Will the seeds actually sprout?",
    a: "Seeds are packed fresh in small batches and stored properly before shipping. If a packet ever arrives damaged or you have germination trouble, message us and we'll make it right.",
  },
  {
    q: "Do you ship outside the US?",
    a: "Not yet — we're US-only for now while we keep things small and reliable.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-deep">
            Good to know
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold text-charcoal sm:text-5xl">
            Questions, answered
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-medium text-charcoal hover:text-sage-dark">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-charcoal/65">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 bg-rose-pale/40 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-deep">
            Say hello
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold text-charcoal sm:text-5xl">
            Get in touch
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/65">
            Questions about an order, a variety, or your garden? The fastest
            way to reach us is a DM on X.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-charcoal text-white hover:bg-charcoal/85"
            >
              <a
                href="https://x.com/igotglitteronme"
                target="_blank"
                rel="noreferrer"
              >
                Message us on X
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-sage/40 text-sage-dark hover:bg-sage-pale"
            >
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <Mail className="size-4" /> {CONTACT_EMAIL}
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <main>
      <Hero />
      <ShopSection />
      <AboutSection />
      <FaqSection />
      <ContactSection />
    </main>
  );
}

export function LoadingFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Loader2 className="size-8 animate-spin text-sage" />
    </div>
  );
}

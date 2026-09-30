import { Sparkles } from "lucide-react";

/**
 * PLACEHOLDER contact email — swap in the real address when ready.
 * Search the codebase for "hello@misoprettyseeds.com" to find every spot.
 */
export const CONTACT_EMAIL = "hello@misoprettyseeds.com";

export function SiteFooter() {
  return (
    <footer className="border-t border-rose-pale bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
        <span className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
          <Sparkles className="size-4 text-rose" />
          MisoPretty Seeds
        </span>
        <p className="max-w-md text-sm text-charcoal/60">
          Small-batch flower seeds, packed by hand with a little glitter.
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
          aria-label="Footer"
        >
          <a href="/#shop" className="text-charcoal/70 hover:text-sage-dark">
            Shop
          </a>
          <a href="/#about" className="text-charcoal/70 hover:text-sage-dark">
            About
          </a>
          <a href="/#faq" className="text-charcoal/70 hover:text-sage-dark">
            FAQ
          </a>
          <a
            href="https://x.com/igotglitteronme"
            target="_blank"
            rel="noreferrer"
            className="text-charcoal/70 hover:text-sage-dark"
          >
            Message us on X
          </a>
        </nav>
        <p className="text-xs text-charcoal/40">
          © {new Date().getFullYear()} MisoPretty Seeds · {CONTACT_EMAIL}
        </p>
      </div>
    </footer>
  );
}

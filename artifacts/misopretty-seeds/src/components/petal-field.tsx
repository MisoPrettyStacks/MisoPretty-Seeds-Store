/**
 * PetalField — a gentle shower of drifting petals behind the hero.
 * Pure CSS animation (no canvas) so it stays smooth on phones.
 * Renders nothing when the user prefers reduced motion.
 */
import { useMemo } from "react";

const PETAL_COLORS = ["#c08a94", "#d9aeb8", "#7a8b5c", "#e8c4cc", "#a9b78d"];

interface Petal {
  left: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  spin: number;
  opacity: number;
  color: string;
}

export function PetalField({ count = 14 }: { count?: number }) {
  const petals = useMemo<Petal[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 97 + 13) % 100,
        size: 8 + ((i * 37) % 14),
        duration: 11 + ((i * 53) % 9),
        delay: -((i * 29) % 18),
        sway: ((i * 41) % 12) - 6,
        spin: 120 + ((i * 61) % 240),
        opacity: 0.35 + ((i * 23) % 40) / 100,
        color: PETAL_COLORS[i % PETAL_COLORS.length],
      })),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {petals.map((p, i) => (
        <span
          key={i}
          className="animate-petal-fall absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.25,
            background: p.color,
            borderRadius: "100% 4% 100% 4%",
            opacity: 0,
            ["--petal-sway" as string]: `${p.sway}vw`,
            ["--petal-spin" as string]: `${p.spin}deg`,
            ["--petal-opacity" as string]: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

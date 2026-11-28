import { useEffect, useState } from "react";

interface ConfettiParticle {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  shape: "star" | "petal" | "circle";
  rotate: string;
}

const COLORS = ["#f4b84b", "#f07c65", "#5cb896", "#6b99d6", "#e58bb8", "#ffd166"];

const PARTICLES: ConfettiParticle[] = Array.from({ length: 24 }, (_, idx) => ({
  id: idx,
  left: `${(idx * 4.2 + (idx % 3) * 1.5).toFixed(1)}%`,
  delay: `${((idx % 6) * 0.06).toFixed(2)}s`,
  duration: `${(1.15 + (idx % 5) * 0.18).toFixed(2)}s`,
  color: COLORS[idx % COLORS.length]!,
  shape: idx % 3 === 0 ? "star" : idx % 3 === 1 ? "petal" : "circle",
  rotate: `${(idx * 47) % 360}deg`
}));

export function ConfettiBurst({ active, triggerKey }: { active: boolean; triggerKey?: string | number }) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(timer);
  }, [active, triggerKey]);

  if (!visible) return null;

  return (
    <div className="confetti-burst-layer" data-testid="confetti-burst" aria-hidden="true">
      {PARTICLES.map((p) => (
        <span
          key={`${triggerKey ?? "burst"}-${p.id}`}
          className={`confetti-piece is-${p.shape}`}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            backgroundColor: p.shape !== "star" ? p.color : undefined,
            color: p.color,
            transform: `rotate(${p.rotate})`
          }}
        >
          {p.shape === "star" ? "★" : ""}
        </span>
      ))}
    </div>
  );
}

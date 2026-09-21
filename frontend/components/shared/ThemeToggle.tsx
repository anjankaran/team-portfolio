"use client";

import { T } from "@/lib/theme";

// A real morph, not a swap — one persistent circle plays both sun and
// moon. The "moon" shape is a genuine SVG mask cutting a crescent out of
// that same circle (not a second icon crossfading in), so animating the
// mask's position smoothly reshapes the disc into a crescent and back,
// and the sun's rays fade/retract as part of the same motion. Plain CSS
// transitions on the SVG geometry (cx/cy/fill/opacity as style properties,
// not Framer) — Framer couldn't read a starting value for children living
// inside a <mask>, since that content is referenced rather than painted.
export function ThemeToggle({
  theme,
  onToggle,
  size = 34,
}: {
  theme: "light" | "dark";
  onToggle: () => void;
  size?: number;
}) {
  const isDark = theme === "dark";
  const maskId = "pf-theme-toggle-mask";
  const geometryTransition = "cx 0.55s cubic-bezier(0.16,1,0.3,1), cy 0.55s cubic-bezier(0.16,1,0.3,1)";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="pf-theme-toggle"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        border: `1px solid ${T.border}`,
        background: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="24" height="24" fill="white" />
            {/* Far outside the disc for "sun" (no bite taken), sweeps in to
                overlap it for "moon" (carves the crescent). */}
            <circle
              r={7.2}
              fill="black"
              style={{ cx: isDark ? 16.5 : 34, cy: isDark ? 7.5 : -8, transition: geometryTransition } as React.CSSProperties}
            />
          </mask>
        </defs>

        <circle
          cx="12"
          cy="12"
          r="5.5"
          mask={`url(#${maskId})`}
          style={{ fill: isDark ? T.text : T.amber, transition: "fill 0.4s ease" }}
        />

        {/* Sun rays — retract and fade away entirely for the moon state. */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const inner = 7.6;
          const outer = 9.6;
          const cx = 12 + Math.cos(angle) * inner;
          const cy = 12 + Math.sin(angle) * inner;
          const ex = 12 + Math.cos(angle) * outer;
          const ey = 12 + Math.sin(angle) * outer;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={ex}
              y2={ey}
              stroke={T.amber}
              strokeWidth={1.8}
              strokeLinecap="round"
              style={{
                opacity: isDark ? 0 : 1,
                transform: isDark ? "scale(0.4)" : "scale(1)",
                transformBox: "view-box",
                transformOrigin: "50% 50%",
                transition: "opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          );
        })}
      </svg>

      <style>{`
        .pf-theme-toggle { transition: border-color .25s ease, background .25s ease; }
        .pf-theme-toggle:hover { border-color: ${T.violet}; background: ${T.violet}14; }
      `}</style>
    </button>
  );
}

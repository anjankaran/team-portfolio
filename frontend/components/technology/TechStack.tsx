"use client";

import { T } from "@/lib/theme";
import { STACK, type TechCategory } from "@/data/technologies";
import { SectionWrap } from "@/components/shared/SectionWrap";
import { Eyebrow } from "@/components/shared/Eyebrow";
import { Reveal } from "@/components/shared/Reveal";

// The original detail card, unchanged — top accent line, label,
// description, item tags — just now living inside a scrolling row instead
// of a static filtered grid.
function TechCard({ cat }: { cat: TechCategory }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: 320,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: 24,
        background: T.surface,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${cat.color}, transparent 70%)`, opacity: 0.8 }} />
      <div className="pf-mono" style={{ fontSize: 11, color: cat.color, letterSpacing: "0.1em", marginBottom: 6 }}>{cat.label}</div>
      <div style={{ fontSize: 12.5, color: T.dim, lineHeight: 1.6, marginBottom: 14 }}>{cat.description}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {cat.items.map((it) => (
          <span key={it} className="pf-mono" style={{ fontSize: 11, padding: "6px 11px", borderRadius: 3, border: `1px solid ${cat.color}44`, background: `${cat.color}0c`, color: T.text }}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

// Duplicated once so the CSS animation can loop seamlessly: translating the
// track exactly -50% of its (now double) width always lands on an identical
// frame to the start, with no visible seam or snap-back.
function MarqueeRow({ cats, direction, duration }: { cats: TechCategory[]; direction: "left" | "right"; duration: number }) {
  const doubled = [...cats, ...cats];
  return (
    <div className="pf-marquee-row">
      <div className={`pf-marquee-track pf-marquee-${direction}`} style={{ animationDuration: `${duration}s` }}>
        {doubled.map((cat, i) => (
          <TechCard key={`${cat.id}-${i}`} cat={cat} />
        ))}
      </div>
    </div>
  );
}

const ROW_A = STACK.filter((_, i) => i % 2 === 0);
const ROW_B = STACK.filter((_, i) => i % 2 === 1);

export function TechStack() {
  return (
    <SectionWrap id="stack">
      <Reveal>
        <Eyebrow color={T.violet}>Technology</Eyebrow>
        <h2 className="pf-disp" style={{ fontSize: "clamp(28px,4.5vw,46px)", fontWeight: 600, maxWidth: 760, letterSpacing: "-0.02em", margin: 0 }}>
          The stack, in use
        </h2>
        <p style={{ color: T.dim, marginTop: 16, maxWidth: 600, fontSize: 15, lineHeight: 1.6 }}>
          Only what we actually ship with — selected by the team, not by a logo budget.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
          <MarqueeRow cats={ROW_A} direction="left" duration={38} />
          <MarqueeRow cats={ROW_B} direction="right" duration={34} />
        </div>
      </Reveal>

      <style>{`
        .pf-marquee-row {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent);
          mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent);
        }
        .pf-marquee-track {
          display: flex;
          gap: 16px;
          width: max-content;
        }
        .pf-marquee-left { animation-name: pf-marquee-left; animation-timing-function: linear; animation-iteration-count: infinite; }
        .pf-marquee-right { animation-name: pf-marquee-right; animation-timing-function: linear; animation-iteration-count: infinite; }
        @keyframes pf-marquee-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pf-marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .pf-marquee-row:hover .pf-marquee-track { animation-play-state: paused; }
      `}</style>
    </SectionWrap>
  );
}

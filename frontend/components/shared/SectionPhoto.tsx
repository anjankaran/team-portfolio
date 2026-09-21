// Full-bleed atmospheric photo behind a section's content — part of the
// "Living Digital Systems" visual language (tech × nature, editorial
// photography). Sits at low opacity so it reads as texture, not a
// competing visual; the section itself needs `position: relative` (already
// true everywhere this is used, via SectionWrap or an inline style) so its
// real content — which needs its own z-index of 1+ — stacks above it. A
// slow Ken Burns drift keeps it from reading as a flat, static wallpaper.
export function SectionPhoto({
  src,
  opacity = 0.12,
  position = "center",
}: {
  src: string;
  opacity?: number;
  position?: string;
}) {
  return (
    <div
      aria-hidden
      className="pf-section-photo"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        ["--photo-opacity" as string]: opacity,
      }}
    >
      <div
        className="pf-section-photo-img"
        style={{
          position: "absolute",
          inset: "-4%",
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: position,
        }}
      />
      <style>{`
        .pf-section-photo {
          opacity: var(--photo-opacity);
        }
        /* A photo at 8-15% opacity reads as texture on the near-black dark
           background, but nearly vanishes against light mode's near-white
           surfaces — boosted here so it stays visible instead of the
           section quietly losing its imagery when toggled to light. */
        :root[data-theme="light"] .pf-section-photo {
          opacity: calc(var(--photo-opacity) * 2.2);
        }
        .pf-section-photo-img {
          animation: pf-photo-drift 42s ease-in-out infinite alternate;
        }
        @keyframes pf-photo-drift {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.06) translate(-1.5%, -1%); }
        }
      `}</style>
    </div>
  );
}

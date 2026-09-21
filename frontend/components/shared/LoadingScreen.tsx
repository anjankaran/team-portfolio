"use client";

import { useEffect, useState } from "react";

// Brand splash shown once per page load — deliberately a light canvas (the
// logo artwork itself sits on white) rather than the dark in-app theme, the
// same way a light launch-screen logo is normal even inside a dark app.
// Entrance is staged: the mark pops in first, then the wordmark, tagline
// and progress bar follow in sequence — not everything landing at once.
export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2000);
    const removeTimer = setTimeout(() => setVisible(false), 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        opacity: fading ? 0 : 1,
        transition: "opacity 480ms ease",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/stackloop_logo.png"
        alt="STACKLOOP"
        width={140}
        height={140}
        className="pf-splash-in"
        style={{ objectFit: "contain", animationDelay: "0ms" }}
      />
      <div
        className="pf-wordmark pf-splash-in"
        style={{ fontSize: 34, color: "#12160f", animationDelay: "420ms" }}
      >
        STACK<span className="pf-wordmark-loop">LOOP</span>
      </div>
      <div
        className="pf-mono pf-splash-in"
        style={{ fontSize: 11.5, letterSpacing: "0.32em", color: "#8b9284", textTransform: "uppercase", animationDelay: "620ms" }}
      >
        Build&nbsp;&nbsp;•&nbsp;&nbsp;Automate&nbsp;&nbsp;•&nbsp;&nbsp;Evolve
      </div>
      <div
        className="pf-splash-in"
        style={{ width: 130, height: 3, borderRadius: 2, background: "#e7eae2", overflow: "hidden", marginTop: 6, animationDelay: "800ms" }}
      >
        <div className="pf-loading-sweep" style={{ height: "100%", width: "36%", background: "#1e9455", borderRadius: 2 }} />
      </div>

      <style>{`
        .pf-splash-in {
          opacity: 0;
          animation: pf-splash-in 560ms cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes pf-splash-in {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pf-loading-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(370%); }
        }
        .pf-loading-sweep { animation: pf-loading-sweep 1.05s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pf-loading-sweep { animation: none; }
          .pf-splash-in { animation-duration: 1ms; }
        }
      `}</style>
    </div>
  );
}

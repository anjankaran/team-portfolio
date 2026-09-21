"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { T } from "@/lib/theme";
import { NAV_ITEMS, STATUS_LINES } from "@/data/site";
import { scrollToSection } from "@/lib/scroll";
import { useCaseStudy } from "@/lib/case-study-context";
import { Magnetic } from "@/components/shared/Magnetic";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

// Continuous section -> nav-tab coverage across the whole page.
// Untracked gaps (Live Demos, Tech Stack, Process) inherit their neighbour tab
// instead of falling back to Home.
const SECTION_TABS: ReadonlyArray<{ id: string; tab: string }> = [
  { id: "hero", tab: "hero" },
  { id: "systems", tab: "systems" },
  { id: "demos", tab: "systems" },
  { id: "live-work", tab: "live-work" },
  { id: "work", tab: "work" },
  { id: "team", tab: "team" },
  { id: "stack", tab: "team" },
  { id: "about", tab: "team" },
  { id: "contact", tab: "contact" },
];

const DARK_BG_RGB = "10, 12, 9";
const LIGHT_BG_RGB = "246, 248, 244";
const DARK_BORDER_RGB = "38, 43, 34";
const LIGHT_BORDER_RGB = "219, 227, 211";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("hero");
  const { openId, setOpenId } = useCaseStudy();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Read the persisted choice once on mount — the inline script in
  // layout.tsx already applied it to <html> before paint, this just syncs
  // this component's own state so the pill background below picks the
  // right RGB triple instead of assuming dark.
  useEffect(() => {
    const stored = document.documentElement.getAttribute("data-theme");
    setTheme(stored === "light" ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (next === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try {
        localStorage.setItem("pf-theme", next);
      } catch {
        // Private browsing / storage disabled — theme just won't persist.
      }
      return next;
    });
  };

  // Flush, invisible bar over the hero that shrinks into a small floating
  // glass "pill" as the page scrolls — noticeably shorter and narrower than
  // the full-width bar, inset from the edges, with a soft shadow. The pill
  // itself uses literal rgba() (not the CSS-var tokens) because Framer's
  // useMotionTemplate needs real numbers to animate the alpha channel, so
  // it picks its RGB triple directly from the active theme instead.
  const { scrollY } = useScroll();
  const scrollSmooth = useSpring(scrollY, { stiffness: 300, damping: 40, mass: 0.4 });
  const navT = useTransform(scrollSmooth, [0, 160], [0, 1]);
  const bgRgb = theme === "light" ? LIGHT_BG_RGB : DARK_BG_RGB;
  const borderRgb = theme === "light" ? LIGHT_BORDER_RGB : DARK_BORDER_RGB;
  const navBg = useMotionTemplate`rgba(${bgRgb}, ${useTransform(navT, [0, 1], [0, 0.86])})`;
  const navBorder = useMotionTemplate`rgba(${borderRgb}, ${navT})`;
  const navBlur = useMotionTemplate`blur(${useTransform(navT, [0, 1], [0, 14])}px)`;
  const navPaddingY = useTransform(navT, [0, 1], [20, 7]);
  const navPadding = useMotionTemplate`${navPaddingY}px 24px`;
  const navOuterTop = useTransform(navT, [0, 1], [0, 12]);
  const navOuterSide = useTransform(navT, [0, 1], [0, 24]);
  const navRadius = useTransform(navT, [0, 1], [0, 16]);
  const navShadow = useMotionTemplate`0 16px 36px -12px rgba(0, 0, 0, ${useTransform(navT, [0, 1], [0, 0.55])})`;
  const navMaxWidth = useTransform(navT, [0, 1], [1276, 1040]);

  // Scroll-spy: highlight the nav tab of whichever section crosses the
  // active zone (~35% viewport height) while scrolling.
  // While a case study is open, the normal sections aren't in the DOM at
  // all, so just pin the tab to Work instead of falling through to Contact.
  useEffect(() => {
    if (openId) {
      setActive("work");
      return;
    }

    const tracked = SECTION_TABS.map((s) => ({
      tab: s.tab,
      el: document.getElementById(s.id),
    })).filter((t): t is { tab: string; el: HTMLElement } => t.el !== null);

    const pick = () => {
      const line = window.innerHeight * 0.35;
      // Inherit the closest section above the active zone.
      let current = tracked[0]?.tab ?? "hero";
      for (const t of tracked) {
        if (t.el.getBoundingClientRect().top <= line) current = t.tab;
        else break;
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        current = "contact";
      }
      setActive(current);
    };

    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [openId]);

  const go = (id: string) => {
    if (openId) setOpenId(null);
    scrollToSection(id);
    setOpen(false);
  };

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        paddingTop: navOuterTop,
        paddingLeft: navOuterSide,
        paddingRight: navOuterSide,
      }}
    >
    <motion.div
      style={{
        width: "100%",
        maxWidth: navMaxWidth,
        pointerEvents: "auto",
        overflow: "hidden",
        border: "1px solid transparent",
        borderColor: navBorder,
        borderRadius: navRadius,
        background: navBg,
        backdropFilter: navBlur,
        WebkitBackdropFilter: navBlur,
        boxShadow: navShadow,
      }}
    >
      <motion.div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: navPadding,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div
          className="pf-disp"
          style={{
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "0.08em",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: T.text,
          }}
          onClick={() => go("hero")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/stackloop_logo1.png"
            alt="STACKLOOP"
            width={44}
            height={44}
            style={{
              display: "block",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <span>
            <span className="pf-wordmark">
              STACK<span className="pf-wordmark-loop">LOOP</span>
            </span>{" "}
            <span style={{ color: T.amber, fontSize: 13, fontWeight: 500 }}>×</span>{" "}
            <span className="pf-mono" style={{ fontSize: 10, color: T.faint, fontWeight: 400, letterSpacing: "0.02em" }}>
              AK·PR
            </span>
          </span>
        </div>

        <div className="pf-nav-desktop" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {NAV_ITEMS.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => go(item.id)}
              className="pf-mono"
              style={{
                position: "relative",
                background: "none",
                border: "none",
                color: active === item.id ? T.text : T.dim,
                fontSize: 13.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "color .25s ease",
                padding: "6px 0",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = active === item.id ? T.text : T.dim)
              }
            >
              {item.label}
              {active === item.id && (
                <motion.span
                  layoutId="pf-nav-underline"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -3,
                    height: 2,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${T.violet}, ${T.blue})`,
                    boxShadow: `0 0 8px ${T.violet}66`,
                  }}
                />
              )}
            </motion.button>
          ))}
        </div>

        <Magnetic className="pf-nav-desktop" strength={0.3}>
          <button
            className="pf-mono"
            onClick={() => go("contact")}
            style={{
              background: "transparent",
              border: `1.5px solid ${T.violet}aa`,
              borderRadius: "4px",
              color: T.text,
              fontSize: 11,
              fontWeight: 500,
              padding: "9px 18px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.25s ease",
              boxShadow: `0 0 10px ${T.violet}15`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${T.violet}15`;
              e.currentTarget.style.boxShadow = `0 0 15px ${T.violet}35`;
              e.currentTarget.style.borderColor = T.violet;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.boxShadow = `0 0 10px ${T.violet}15`;
              e.currentTarget.style.borderColor = `${T.violet}aa`;
            }}
          >
            START A PROJECT <ArrowRight size={12} />
          </button>
        </Magnetic>

        <ThemeToggle theme={theme} onToggle={toggleTheme} size={32} />

        <button
          className="pf-nav-mobile"
          onClick={() => setOpen((o) => !o)}
          style={{
            background: "none",
            border: `1px solid ${T.border}`,
            color: T.text,
            borderRadius: 3,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          <span className="pf-mono" style={{ fontSize: 11 }}>{open ? "CLOSE" : "MENU"}</span>
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ borderTop: `1px solid ${T.border}`, background: T.bg, overflow: "hidden" }}
          >
            <div style={{ padding: "14px 24px 22px", display: "flex", flexDirection: "column", gap: 4 }}>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className="pf-mono"
                  style={{
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    color: active === item.id ? T.violet : T.dim,
                    padding: "10px 0",
                    fontSize: 14,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "color .25s ease",
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => go("contact")}
                className="pf-mono"
                style={{
                  marginTop: 10,
                  justifyContent: "center",
                  background: "transparent",
                  border: `1.5px solid ${T.violet}`,
                  borderRadius: "4px",
                  color: T.text,
                  fontSize: 12,
                  padding: "12px",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                START A PROJECT <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .pf-nav-desktop { display: flex; }
        .pf-nav-mobile { display: none; }
        @media (max-width: 900px) {
          .pf-nav-desktop { display: none !important; }
          .pf-nav-mobile { display: inline-flex; }
        }
      `}</style>
    </motion.div>
    </motion.div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, MessageSquare } from "lucide-react";
import { T } from "@/lib/theme";
import { answerAssistant } from "@/data/process";
import { PROJECTS } from "@/data/projects";
import { scrollToSection } from "@/lib/scroll";
import { useCaseStudy } from "@/lib/case-study-context";

interface Msg {
  role: "user" | "bot";
  text: string;
  projectIds?: string[];
}

const QUICK_PROMPTS = [
  "What does STACKLOOP build?",
  "Tell me about Pritam.",
  "Tell me about Anjan.",
  "What AI agents can you build?",
  "Start a project",
];

export function PortfolioAssistant() {
  const [open, setOpen] = useState(false);
  const { setOpenId, setReturnSection } = useCaseStudy();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Ask me what this team builds — I'll answer from the portfolio itself." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [showContactAction, setShowContactAction] = useState(false);
  const assistantRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!assistantRef.current?.contains(target)) setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  // Type the opening message before revealing the suggested questions.
  useEffect(() => {
    if (!open || introComplete) return;
    setTyping(true);
    const timer = window.setTimeout(() => {
      setTyping(false);
      setIntroComplete(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [open, introComplete]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing, open]);

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || !introComplete || typing) return;
    const wantsToStart = /start (a|my) project|hire|contact|work with you|build with you/i.test(q);
    const wantsProjectList = /projects|case studies|what have you built|list projects/i.test(q);
    const wantsProjectLinks = wantsProjectList || /what does stackloop build|what do you build|capabilities/i.test(q);
    setShowContactAction(false);
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, {
        role: "bot",
        text: wantsToStart
          ? "Great — tell us what you want to build, and we’ll take it from idea to deployment. Open the contact section to start the conversation."
          : answerAssistant(q),
        projectIds: wantsProjectLinks ? PROJECTS.map((project) => project.id) : undefined,
      }]);
      setShowContactAction(wantsToStart);
    }, 500);
  };

  const openContactForm = () => {
    scrollToSection("contact");
    setOpen(false);
    window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>('textarea[name="message"]')?.focus();
    }, 650);
  };

  return (
    <div ref={assistantRef} style={{ position: "fixed", bottom: 22, right: 22, zIndex: 60 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 340,
              maxWidth: "calc(100vw - 44px)",
              height: 460,
              background: T.surface,
              border: `1px solid ${T.borderLit}`,
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              marginBottom: 12,
              boxShadow: "0 24px 80px rgba(0,0,0,.55)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg2 }}>
              <div className="pf-mono" style={{ fontSize: 11, color: T.amber, letterSpacing: "0.06em" }}>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: T.amber, marginRight: 8, animation: "pf-pulse 1.6s infinite" }} />
                STACKLOOP ASSISTANT
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: T.faint, cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>
            <div className="pf-assist-scroll" style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {introComplete && msgs.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "92%" }}>
                  <div
                    style={{
                      background: m.role === "user" ? `${T.amberDim}33` : T.surface2,
                      border: `1px solid ${m.role === "user" ? `${T.amber}44` : T.border}`,
                      borderRadius: 8,
                      padding: "9px 12px",
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: T.text,
                    }}
                  >
                    {m.text}
                  </div>
                  {m.projectIds && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {m.projectIds.map((id) => {
                        const project = PROJECTS.find((item) => item.id === id);
                        if (!project) return null;
                        return (
                          <button
                            key={id}
                            onClick={() => { setReturnSection("work"); setOpenId(id); setOpen(false); }}
                            className="pf-mono"
                            style={{ fontSize: 10, padding: "6px 8px", border: `1px solid ${project.color}66`, borderRadius: 5, background: `${project.color}12`, color: project.color, cursor: "pointer", textAlign: "left" }}
                          >
                            {project.name} ↗
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              {typing && (
                <div style={{ alignSelf: "flex-start", fontSize: 12, color: T.faint, fontFamily: "IBM Plex Mono, monospace" }}>
                  <span style={{ animation: "pf-pulse 1s infinite" }}>●</span> reasoning…
                </div>
              )}
              {showContactAction && !typing && (
                <button
                  onClick={openContactForm}
                  className="pf-mono"
                  style={{ alignSelf: "flex-start", padding: "8px 11px", border: `1px solid ${T.amber}`, borderRadius: 5, background: `${T.amber}18`, color: T.amber, cursor: "pointer", fontSize: 10.5, letterSpacing: "0.04em" }}
                >
                  OPEN CONTACT FORM →
                </button>
              )}
              <div ref={endRef} />
            </div>
            {introComplete && msgs.length === 1 && !typing && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 14px 10px" }}>
                {QUICK_PROMPTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="pf-mono"
                    style={{ fontSize: 10.5, padding: "6px 10px", border: `1px solid ${T.border}`, borderRadius: 4, background: "none", color: T.dim, cursor: "pointer" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", borderTop: `1px solid ${T.border}`, padding: 10, gap: 8, background: T.bg2 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={!introComplete || typing}
                placeholder="Ask about the team…"
                style={{
                  flex: 1,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  color: T.text,
                  padding: "10px 12px",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
              <button
                onClick={() => send()}
                style={{ background: T.amber, border: "none", borderRadius: 6, width: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Send size={14} color="#16110a" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        suppressHydrationWarning
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: open ? T.surface2 : T.amber,
          border: `1px solid ${open ? T.borderLit : T.amber}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          marginLeft: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,.45)",
        }}
        aria-label="Open portfolio assistant"
      >
        {open ? <X size={20} color={T.text} /> : <MessageSquare size={20} color="#16110a" />}
      </button>
      <style>{`
        .pf-assist-scroll::-webkit-scrollbar { width: 5px; }
        .pf-assist-scroll::-webkit-scrollbar-thumb { background: ${T.borderLit}; border-radius: 4px; }
        .pf-assist-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

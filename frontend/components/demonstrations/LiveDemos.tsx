"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Play, RotateCcw, Radio, Bot, Send } from "lucide-react";
import { T } from "@/lib/theme";
import { DEMOS, type Demo } from "@/data/demos";
import { Eyebrow } from "@/components/shared/Eyebrow";
import { Reveal } from "@/components/shared/Reveal";
import { FlowReveal } from "@/components/shared/FlowReveal";

const EASE = [0.16, 1, 0.3, 1] as const;
const STEP_MS = 700;

// How many windows peek out behind the active one, and by how much.
// Offsets grow but by a shrinking increment, so deeper windows huddle closer together.
const STACK_OFFSETS = [
  { x: 0, y: 0, scale: 1, opacity: 1 },
  { x: -16, y: 14, scale: 0.965, opacity: 0.62 },
  { x: -26, y: 24, scale: 0.936, opacity: 0.34 },
];
const MAX_VISIBLE_DEPTH = STACK_OFFSETS.length - 1;

// Clean a demo prompt into a plain chat-bubble sentence
const bubbleText = (p: string) =>
  p
    .replace(/^>\s*/, "") // leading shell marker
    .replace(/^customer messages?\s*:\s*/i, "") // "Customer messages:" tag
    .replace(/^[“"]+/, "") // opening quote
    .replace(/[”".]+$/, "") // closing quote / trailing dots
    .trim();

// Dummy agent replies per demo (a real backend comes later)
const AGENT_REPLIES: Record<string, string> = {
  agent:
    "Hi! Your order #4821 was dispatched today via BlueDart and is expected by Thursday, 6 PM 📦 The tracking link has been sent to your WhatsApp ✅",
  whatsapp:
    "Hello 👋 Your order is out for delivery tomorrow between 10 AM – 1 PM. Reply here anytime if you'd like to reschedule.",
  lead:
    "Lead qualified — score 87/100 🔥 Owner notified in real time and a follow-up is scheduled for tomorrow at 11 AM.",
  api:
    '{ "order": "#4821", "status": "shipped", "carrier": "BlueDart", "eta": "Thu 6 PM" } · 200 OK · 42 ms',
  workflow:
    "invoice_paid processed → fulfillment triggered → receipt e-mailed. Workflow closed with a clean state ✔",
};

// Suggested follow-ups shown above the input once the scripted exchange
// finishes — tapping one fills it in as a real user message.
const QUICK_REPLIES: Record<string, string[]> = {
  agent: ["Can I change the delivery address?", "What if I'm not home?", "Cancel my order"],
  whatsapp: ["When will it arrive?", "Can I reschedule?", "Talk to a human"],
  lead: ["What's the next step?", "Send me the proposal", "Book a call"],
};

// Canned replies for the interactive follow-up thread — matched to the
// quick-reply that was sent, otherwise a generic per-demo fallback.
const FOLLOWUP_REPLIES: Record<string, Record<string, string>> = {
  agent: {
    "Can I change the delivery address?": "Sure — reply with the new address and I'll update it before the dispatch cut-off.",
    "What if I'm not home?": "No worries — the courier will attempt redelivery the next day or leave it at your building's front desk.",
    "Cancel my order": "Order #4821 has been flagged for cancellation. A refund will reflect in your account in 3–5 business days.",
  },
  whatsapp: {
    "When will it arrive?": "Tomorrow between 10 AM – 1 PM 🚚",
    "Can I reschedule?": "Of course — which day works better for you?",
    "Talk to a human": "Connecting you to a support agent now, one moment ⏳",
  },
  lead: {
    "What's the next step?": "Our team will call you tomorrow at 11 AM to walk through pricing.",
    "Send me the proposal": "Proposal sent to your inbox — let me know if anything needs adjusting.",
    "Book a call": "Here's a link to grab a slot: cal.stackloop.dev/intro",
  },
};
const GENERIC_FOLLOWUP: Record<string, string> = {
  agent: "Got it — I've noted that down and our team will follow up shortly ✅",
  whatsapp: "Got it 👍 I'll pass that along right away.",
  lead: "Noted — I've logged this and the sales team will follow up shortly.",
};

// Per-demo chat skins so every tab feels like its own product surface
type ChatTheme = {
  title: string;
  sub: string;
  headerBg: string;
  bodyBg: string;
  userBg: string;
  userBorder: string;
  agentBg: string;
  agentBorder: string;
  accent: string;
  wa?: boolean; // WhatsApp flavor: timestamps + double ticks
  terminal?: boolean; // terminal-style streaming log
};

const CHAT_THEMES: Record<string, ChatTheme> = {
  agent: {
    title: "LIVE AGENT",
    sub: "ONLINE · AVG REPLY ~2S",
    headerBg: T.bg2,
    bodyBg: T.bg2,
    userBg: `${T.violet}16`,
    userBorder: `${T.violet}40`,
    agentBg: T.surface2,
    agentBorder: T.border,
    accent: "#74bb7e",
  },
  whatsapp: {
    title: "STACKLOOP BUSINESS",
    sub: "online",
    headerBg: "#202c33",
    bodyBg: "#0b141a",
    userBg: "#005c4b",
    userBorder: "transparent",
    agentBg: "#202c33",
    agentBorder: "transparent",
    accent: "#25d366",
    wa: true,
  },
  lead: {
    title: "CRM ASSISTANT",
    sub: "ONLINE · SYNCING CRM",
    headerBg: "#10141c",
    bodyBg: "#10141c",
    userBg: `${T.blue}14`,
    userBorder: `${T.blue}38`,
    agentBg: "#151a23",
    agentBorder: `${T.blue}26`,
    accent: "#4fa98c",
  },
  api: {
    title: "~/api-console",
    sub: "HTTP · JSON · LIVE",
    headerBg: "#0a0e14",
    bodyBg: "#0a0e14",
    userBg: `${T.blue}10`,
    userBorder: `${T.blue}30`,
    agentBg: "#0f1520",
    agentBorder: `${T.blue}22`,
    accent: "#4fa98c",
    terminal: true,
  },
  workflow: {
    title: "~/workflow-runner",
    sub: "TRIGGERS · RUNNING",
    headerBg: "#14120d",
    bodyBg: "#14120d",
    userBg: `${T.amber}12`,
    userBorder: `${T.amber}36`,
    agentBg: "#191713",
    agentBorder: `${T.amber}28`,
    accent: "#e3b462",
    terminal: true,
  },
};

// Streaming log lines for terminal-style demos (revealed in sync with the left flow)
const TERMINAL_LOGS: Record<string, string[]> = {
  api: [
    "$ GET /orders/4821",
    "→ route matched · api/orders/[id]",
    "→ auth verified · scope orders:read",
    "→ db query · SELECT * FROM orders WHERE id = 4821",
    "→ row found · order #4821 (shipped)",
    "← 200 OK · 42 ms",
    '{ "order": "#4821", "status": "shipped", "carrier": "BlueDart", "tracking": "BD7742913", "eta": "Thu 6 PM" }',
  ],
  workflow: [
    "⚡ trigger received · invoice_paid",
    "→ workflow wf_8821 spawned",
    "→ agent · resolving next step…",
    "→ tool call · fulfillment.execute(#4821)",
    "→ action committed across systems",
    "✔ closed clean · receipt e-mailed · 118 ms",
  ],
};

type RunState = { step: number; running: boolean };
type Phase = "idle" | "running" | "done";

const phaseOf = (s: RunState | undefined): Phase =>
  !s || s.step < 0 ? "idle" : s.running ? "running" : "done";

// One live agent chat window — its own header, messages and status.
// Rendered once per opened demo; the stack wrapper positions it in depth.
function AgentChat({
  demo,
  phase,
  step,
  front,
}: {
  demo: Demo;
  phase: Phase;
  step: number;
  front: boolean;
}) {
  const th = CHAT_THEMES[demo.id] ?? CHAT_THEMES.agent;
  const monoText = demo.id === "api";

  // The message itself only "sends" once this window is front-most — a
  // peeking background window stays quiet, even if it's mid-flow underneath.
  const displayPhase: Phase = front ? phase : "idle";

  // Interactive follow-up thread — unlocks once the scripted exchange is
  // done. Local to this window so each demo keeps its own conversation.
  const [extra, setExtra] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPhase = useRef<Phase>(phase);

  // A fresh run of this demo (real step 0, not the display-gated one) clears
  // whatever follow-up conversation was left over from the last run.
  useEffect(() => {
    if (phase === "running" && prevPhase.current !== "running" && step === 0) {
      setExtra([]);
      setInput("");
      setTyping(false);
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
        typingTimer.current = null;
      }
    }
    prevPhase.current = phase;
  }, [phase, step]);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setExtra((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    const reply = FOLLOWUP_REPLIES[demo.id]?.[trimmed] ?? GENERIC_FOLLOWUP[demo.id] ?? "Got it — thanks, we'll take it from here ✅";
    typingTimer.current = setTimeout(() => {
      typingTimer.current = null;
      setTyping(false);
      setExtra((prev) => [...prev, { role: "agent", text: reply }]);
    }, 900 + Math.random() * 500);
  };

  // Terminal demos: reveal log lines in sync with the left flow
  const logs = TERMINAL_LOGS[demo.id];
  const visibleCount =
    th.terminal && logs
      ? displayPhase === "idle"
        ? 0
        : displayPhase === "done"
          ? logs.length
          : Math.max(
              1,
              Math.min(
                Math.round(((step + 1) / demo.steps.length) * logs.length),
                logs.length - 1
              )
            )
      : 0;

  const lineColor = (l: string) =>
    l.startsWith("$") || l.startsWith("⚡")
      ? th.accent
      : l.startsWith("✔") || l.startsWith("←")
        ? "#3fb950"
        : l === "{" || l === "}" || l.trimStart().startsWith('"')
          ? "#79c0ff"
          : "#a7ab98";

  // Keep the newest message in view — the body scrolls internally (fixed
  // window height), so anything appended below the fold needs an explicit
  // scroll or it sits hidden behind the input bar.
  const messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [extra, typing, displayPhase, visibleCount]);

  return (
    <div
      style={{
        border: `1px solid ${th.wa ? "#111b21" : T.border}`,
        borderRadius: 8,
        background: th.headerBg,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 380,
        overflow: "hidden",
        boxShadow: front
          ? "0 20px 44px rgba(0,0,0,0.4)"
          : "0 8px 20px rgba(0,0,0,0.32)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "13px 16px",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {th.terminal ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
              <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
            ))}
          </div>
        ) : (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: `${demo.color}14`,
              border: `1px solid ${demo.color}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bot size={15} color={demo.color} />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span className="pf-mono" style={{ fontSize: 10.5, letterSpacing: "0.1em", color: T.text }}>
            {th.title}
          </span>
          <span
            className="pf-mono"
            style={{ fontSize: 8.5, letterSpacing: "0.08em", color: th.accent, display: "flex", alignItems: "center", gap: 5 }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: th.accent, animation: "pf-pulse 1.6s infinite" }} />
            {th.sub}
          </span>
        </div>
        {/* Small indicator of which demo this window belongs to */}
        <span
          className="pf-mono"
          style={{
            marginLeft: "auto",
            fontSize: 8.5,
            color: front ? th.accent : T.faint,
            letterSpacing: "0.1em",
            border: `1px solid ${front ? `${th.accent}44` : T.border}`,
            borderRadius: 4,
            padding: "3px 6px",
            whiteSpace: "nowrap",
          }}
        >
          {demo.name.toUpperCase()}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 18,
          background: th.bodyBg,
          fontFamily: th.terminal ? "var(--font-mono, monospace)" : undefined,
          overflowY: "auto",
        }}
      >
        {th.terminal && logs ? (
          <>
            {visibleCount === 0 && (
              <div className="pf-mono" style={{ fontSize: 11.5, color: "#8b949e", lineHeight: 2 }}>
                {demo.id === "api" ? "$ awaiting request…" : "// listening for events…"}
              </div>
            )}
            {logs.slice(0, visibleCount).map((l, i) => (
              <motion.div
                key={`${demo.id}-log-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="pf-mono"
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.9,
                  color: lineColor(l),
                  fontWeight: l.startsWith("✔") ? 700 : 400,
                  whiteSpace: "pre-wrap",
                }}
              >
                {l}
                {displayPhase === "running" && i === visibleCount - 1 && (
                  <span style={{ animation: "pf-blink 1s infinite", marginLeft: 4 }}>▋</span>
                )}
              </motion.div>
            ))}
          </>
        ) : (
        <>
        {displayPhase === "idle" && (
          <div
            className="pf-mono"
            style={{ margin: "auto", textAlign: "center", fontSize: 10.5, color: T.faint, lineHeight: 1.8 }}
          >
            {"// waiting for customer message…"}
            <br />
            press RUN on the flow to start the exchange
          </div>
        )}

        {displayPhase !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: EASE }}
            style={{
              alignSelf: "flex-end",
              maxWidth: "88%",
              background: th.userBg,
              border: `1px solid ${th.userBorder}`,
              borderRadius: th.wa ? "10px 10px 3px 10px" : "10px 10px 3px 10px",
              padding: "9px 12px",
            }}
          >
            <div className="pf-mono" style={{ fontSize: 8, letterSpacing: "0.14em", color: th.accent, marginBottom: 4 }}>
              {th.wa ? "YOU · NOW" : "CUSTOMER · NOW"}
            </div>
            <div style={{ fontSize: monoText ? 12 : 13, color: th.wa ? "#e9edef" : T.text, lineHeight: 1.5 }}>
              {bubbleText(demo.prompt)}
            </div>
            {th.wa && (
              <div
                className="pf-mono"
                style={{ fontSize: 8, color: "#8696a0", textAlign: "right", marginTop: 4, letterSpacing: "0.05em" }}
              >
                11:02 AM <span style={{ color: "#53bdeb" }}>✓✓</span>
              </div>
            )}
          </motion.div>
        )}

        {displayPhase === "running" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{
              alignSelf: "flex-start",
              display: "flex",
              gap: 5,
              alignItems: "center",
              background: th.agentBg,
              border: `1px solid ${th.agentBorder}`,
              borderRadius: "10px 10px 10px 3px",
              padding: "11px 13px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                style={{ width: 5, height: 5, borderRadius: "50%", background: demo.color }}
              />
            ))}
          </motion.div>
        )}

        {displayPhase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{
              alignSelf: "flex-start",
              maxWidth: "94%",
              background: th.agentBg,
              border: `1px solid ${th.agentBorder}`,
              borderRadius: "10px 10px 10px 3px",
              padding: "10px 12px",
            }}
          >
            <div className="pf-mono" style={{ fontSize: 8, letterSpacing: "0.14em", color: th.accent, marginBottom: 4 }}>
              {th.wa ? "STACKLOOP AGENT · 11:02 AM" : "AGENT · JUST NOW"}
            </div>
            <div
              className={monoText ? "pf-mono" : undefined}
              style={{
                fontSize: monoText ? 11.5 : 13,
                color: th.wa ? "#d1d7db" : T.text,
                lineHeight: 1.55,
                whiteSpace: monoText ? "pre-wrap" : undefined,
              }}
            >
              {AGENT_REPLIES[demo.id] ?? "Done ✅ Request processed successfully."}
            </div>
          </motion.div>
        )}

        {/* Interactive follow-up thread, once the scripted exchange is done */}
        <AnimatePresence initial={false}>
          {extra.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={
                m.role === "user"
                  ? {
                      alignSelf: "flex-end",
                      maxWidth: "88%",
                      background: th.userBg,
                      border: `1px solid ${th.userBorder}`,
                      borderRadius: "10px 10px 3px 10px",
                      padding: "9px 12px",
                    }
                  : {
                      alignSelf: "flex-start",
                      maxWidth: "94%",
                      background: th.agentBg,
                      border: `1px solid ${th.agentBorder}`,
                      borderRadius: "10px 10px 10px 3px",
                      padding: "10px 12px",
                    }
              }
            >
              <div style={{ fontSize: 13, color: th.wa ? (m.role === "user" ? "#e9edef" : "#d1d7db") : T.text, lineHeight: 1.5 }}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                alignSelf: "flex-start",
                display: "flex",
                gap: 5,
                alignItems: "center",
                background: th.agentBg,
                border: `1px solid ${th.agentBorder}`,
                borderRadius: "10px 10px 10px 3px",
                padding: "11px 13px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  style={{ width: 5, height: 5, borderRadius: "50%", background: demo.color }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </div>

      {/* Real input — unlocks once the scripted exchange finishes */}
      {!th.terminal && (
      <div
        style={{
          padding: "12px 18px 16px",
          borderTop: `1px solid ${th.wa ? "#111b21" : T.border}`,
          background: th.wa ? "#202c33" : th.headerBg,
          flexShrink: 0,
        }}
      >
        {displayPhase === "done" ? (
          <>
            {(QUICK_REPLIES[demo.id]?.length ?? 0) > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {QUICK_REPLIES[demo.id].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={typing}
                    className="pf-mono"
                    style={{
                      border: `1px solid ${th.accent}44`,
                      background: `${th.accent}12`,
                      color: th.accent,
                      borderRadius: 999,
                      padding: "5px 10px",
                      fontSize: 10,
                      letterSpacing: "0.02em",
                      cursor: typing ? "default" : "pointer",
                      opacity: typing ? 0.5 : 1,
                      whiteSpace: "nowrap",
                      transition: "opacity .2s",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: `1px solid ${th.wa ? "transparent" : T.border}`,
                borderRadius: th.wa ? 22 : 6,
                padding: "8px 8px 8px 16px",
                background: th.wa ? "#2a3942" : T.surface,
                boxShadow: "0 1px 5px rgba(0,0,0,0.35)",
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="pf-mono"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: th.wa ? "#e9edef" : T.text,
                  fontSize: 12,
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label="Send message"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: th.wa ? "50%" : 5,
                  border: "none",
                  background: th.accent,
                  color: "#0a0c09",
                  cursor: !input.trim() || typing ? "default" : "pointer",
                  opacity: !input.trim() || typing ? 0.4 : 1,
                  flexShrink: 0,
                  transition: "opacity .2s",
                }}
              >
                <Send size={13} />
              </button>
            </form>
          </>
        ) : (
          <div
            className="pf-mono"
            style={{
              border: `1px dashed ${T.border}`,
              borderRadius: 6,
              padding: "11px 14px",
              fontSize: 11,
              color: T.faint,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {displayPhase === "idle" ? "Waiting for the demo to run…" : "Agent is replying…"}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// Every opened demo keeps its own live window, layered behind the active one.
// Clicking a peeking window brings that demo's session to the front, same as its tab.
function ChatWindowStack({
  openOrder,
  runStates,
  onBringToFront,
}: {
  openOrder: string[];
  runStates: Record<string, RunState>;
  onBringToFront: (id: string) => void;
}) {
  return (
    <div style={{ position: "relative", height: "100%", minHeight: 380 }}>
      {openOrder.map((id, i) => {
        const demo = DEMOS.find((d) => d.id === id);
        if (!demo) return null;
        const depthRaw = openOrder.length - 1 - i; // 0 = front-most
        const depth = Math.min(depthRaw, MAX_VISIBLE_DEPTH);
        const front = depthRaw === 0;
        const { x, y, scale, opacity } = STACK_OFFSETS[depth];
        const hidden = depthRaw > MAX_VISIBLE_DEPTH;
        const rs = runStates[id];

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 36, scale: 0.94 }}
            animate={{ opacity: hidden ? 0 : opacity, x, y, scale }}
            transition={{ duration: 0.55, ease: EASE }}
            onClick={front ? undefined : () => onBringToFront(id)}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: i,
              pointerEvents: hidden ? "none" : "auto",
              cursor: front ? "default" : "pointer",
              transformOrigin: "bottom left",
            }}
          >
            <AgentChat demo={demo} phase={phaseOf(rs)} step={rs?.step ?? -1} front={front} />
          </motion.div>
        );
      })}
    </div>
  );
}

export function LiveDemos() {
  const [active, setActive] = useState<string>(DEMOS[0].id);
  const [openOrder, setOpenOrder] = useState<string[]>([DEMOS[0].id]);
  const [runStates, setRunStates] = useState<Record<string, RunState>>({});
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const startTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const wasInView = useRef(false);
  // No `once` — re-entering the section (scroll away, then back) should
  // replay the currently selected demo's message again, every time.
  const inView = useInView(panelRef, { amount: 0.3 });

  const demo = DEMOS.find((d) => d.id === active)!;
  const activeRun = runStates[active];
  const step = activeRun?.step ?? -1;
  const running = activeRun?.running ?? false;

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearInterval);
      Object.values(startTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Always starts from the beginning — switching to a demo (even one you've
  // already seen finish) replays the message send from scratch.
  const runDemo = (id: string) => {
    const target = DEMOS.find((d) => d.id === id);
    if (!target) return;
    if (timers.current[id]) clearInterval(timers.current[id]);

    let i = 0;
    setRunStates((prev) => ({ ...prev, [id]: { step: i, running: true } }));
    timers.current[id] = setInterval(() => {
      i++;
      if (i >= target.steps.length) {
        clearInterval(timers.current[id]);
        delete timers.current[id];
        setRunStates((prev) => ({ ...prev, [id]: { step: target.steps.length - 1, running: false } }));
        return;
      }
      setRunStates((prev) => ({ ...prev, [id]: { step: i, running: true } }));
    }, STEP_MS);
  };

  // Freezes a window's flow — used on the demo being replaced at the front,
  // so only the front-most window keeps ticking. Also cancels any pending
  // delayed start so a demo that's about to be backgrounded doesn't fire late.
  const pauseDemo = (id: string) => {
    if (timers.current[id]) {
      clearInterval(timers.current[id]);
      delete timers.current[id];
    }
    if (startTimers.current[id]) {
      clearTimeout(startTimers.current[id]);
      delete startTimers.current[id];
    }
  };

  const resetDemo = (id: string) => {
    pauseDemo(id);
    setRunStates((prev) => ({ ...prev, [id]: { step: -1, running: false } }));
  };

  // Drops a demo back to idle immediately, then sends its message after a
  // short beat — so it visibly "sends" instead of appearing already-sent.
  const scheduleStart = (id: string, delay: number) => {
    pauseDemo(id);
    setRunStates((prev) => ({ ...prev, [id]: { step: -1, running: false } }));
    startTimers.current[id] = setTimeout(() => {
      delete startTimers.current[id];
      runDemo(id);
    }, delay);
  };

  // Bring a demo's window to the front and replay its message from the
  // start — the demo being replaced at the front is paused.
  const openDemo = (id: string) => {
    if (id !== active) pauseDemo(active);
    setActive(id);
    setOpenOrder((prev) => (prev.includes(id) ? [...prev.filter((x) => x !== id), id] : [...prev, id]));
    scheduleStart(id, 450);
  };

  // Replay the currently selected demo every time the panel re-enters view.
  useEffect(() => {
    if (inView && !wasInView.current) {
      wasInView.current = true;
      scheduleStart(active, 600);
      return () => pauseDemo(active);
    }
    if (!inView) {
      wasInView.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, active]);

  return (
    <section id="demos" style={{ background: T.bg2, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "120px 24px" }}>
        <Reveal>
          <Eyebrow color={T.amber}>Live Demonstrations</Eyebrow>
          <h2 className="pf-disp" style={{ fontSize: "clamp(28px,4.5vw,46px)", fontWeight: 600, maxWidth: 760, letterSpacing: "-0.02em", margin: 0 }}>
            Systems in motion
          </h2>
          <p style={{ color: T.dim, marginTop: 16, maxWidth: 600, fontSize: 15, lineHeight: 1.6 }}>
            Press run and watch the actual sequence a request travels through — every step is a real path we build.
          </p>
        </Reveal>

        <div style={{ display: "flex", gap: 8, marginTop: 40, flexWrap: "wrap" }}>
          {DEMOS.map((d, i) => (
            <Reveal key={d.id} delay={i * 90}>
              <button
                onClick={() => openDemo(d.id)}
                className="pf-mono"
                suppressHydrationWarning
                style={{
                  display: "inline-flex",
                  padding: "10px 16px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11.5,
                  letterSpacing: "0.05em",
                  border: `1px solid ${active === d.id ? d.color : T.border}`,
                  background: active === d.id ? `${d.color}14` : "transparent",
                  color: active === d.id ? d.color : T.dim,
                  transition: "all .25s",
                }}
              >
                {d.name}
              </button>
            </Reveal>
          ))}
        </div>

        <div
          ref={panelRef}
          style={{
            marginTop: 32,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: 28,
            background: T.surface,
          }}
        >
          <div className="pf-demo-grid">
            {/* Left: request flow for the active demo */}
            <div key={active} style={{ minWidth: 0 }}>
              <FlowReveal>
                <div
                  className="pf-mono"
                  style={{
                    fontSize: 12,
                    color: T.dim,
                    marginBottom: 20,
                    padding: "12px 16px",
                    border: `1px solid ${T.border}`,
                    borderRadius: 4,
                    background: T.bg2,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minHeight: 44,
                  }}
                >
                  <span style={{ color: demo.color, flexShrink: 0 }}>{running ? "●" : ">"}</span>
                  <span>{demo.prompt}</span>
                </div>
              </FlowReveal>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {demo.steps.map((s, i) => {
                  const activeNow = i === step;
                  const past = i < step;
                  const done = i <= step;
                  return (
                    <FlowReveal key={`${demo.id}-${i}`} delay={i * 110} from="top">
                      <div style={{ display: "flex", gap: 14 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              border: `2px solid ${done ? demo.color : T.border}`,
                              background: activeNow ? demo.color : "transparent",
                              transition: "all .3s",
                              animation: activeNow ? "pf-pulse-scale 1s ease-out infinite" : "none",
                              flexShrink: 0,
                              marginTop: 6,
                            }}
                          />
                          {i < demo.steps.length - 1 && (
                            <div
                              style={{
                                width: 1,
                                flex: 1,
                                minHeight: 24,
                                background: past ? demo.color : T.border,
                                transition: "background .3s",
                              }}
                            />
                          )}
                        </div>
                        <div style={{ paddingBottom: 18, opacity: done ? 1 : 0.4, transition: "opacity .3s" }}>
                          <div
                            className="pf-mono"
                            style={{
                              fontSize: 12.5,
                              color: activeNow ? demo.color : T.text,
                              letterSpacing: "0.06em",
                              transition: "color .3s",
                            }}
                          >
                            {s.label}
                          </div>
                          {/* Always rendered so the layout never grows mid-run */}
                          <div
                            style={{
                              fontSize: 13,
                              color: T.dim,
                              marginTop: 3,
                              maxWidth: 420,
                              lineHeight: 1.5,
                              visibility: done ? "visible" : "hidden",
                              opacity: done ? 1 : 0,
                              transition: "opacity .35s ease",
                            }}
                          >
                            {s.desc}
                          </div>
                        </div>
                      </div>
                    </FlowReveal>
                  );
                })}
              </div>

              <FlowReveal delay={demo.steps.length * 110}>
                <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                  <button
                    className="pf-btn pf-btn-solid"
                    onClick={() => runDemo(active)}
                    disabled={running}
                    suppressHydrationWarning
                    style={{ opacity: running ? 0.6 : 1, cursor: running ? "default" : "pointer" }}
                  >
                    {running ? <Radio size={13} /> : <Play size={13} />} {running ? "Running…" : "Run"}
                  </button>
                  <button className="pf-btn" onClick={() => resetDemo(active)} suppressHydrationWarning>
                    <RotateCcw size={13} /> Reset
                  </button>
                  <span className="pf-mono" style={{ marginLeft: "auto", fontSize: 10, color: T.faint }}>
                    {step < 0 ? "READY" : running ? `STEP ${step + 1}/${demo.steps.length}` : "COMPLETE"}
                  </span>
                </div>
              </FlowReveal>
            </div>

            {/* Right: layered stack of every demo's live agent window */}
            <ChatWindowStack openOrder={openOrder} runStates={runStates} onBringToFront={openDemo} />
          </div>

          <style>{`
            .pf-demo-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:26px;align-items:stretch;}
            @media(max-width:900px){.pf-demo-grid{grid-template-columns:1fr !important;}}
          `}</style>
        </div>
      </div>
    </section>
  );
}

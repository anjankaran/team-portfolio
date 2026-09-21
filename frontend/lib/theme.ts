// "Living Digital Systems" palette — deep charcoal with a forest/olive
// cast, warm off-white type, muted moss + emerald accents instead of the
// former violet/blue, warm gold kept for the third accent. Token *names*
// are unchanged on purpose (`violet`, `blue`, `amber`) — everything in the
// app addresses colors through these keys, so retinting here cascades
// site-wide without touching component logic.
//
// Neutral surface/text tokens resolve through CSS custom properties (see
// globals.css's `:root` / `:root[data-theme="light"]`) so the light/dark
// toggle (ThemeToggle, wired in Nav) repaints every consumer automatically
// without each component needing to know which theme is active. The accent
// tokens stay literal hex on purpose: dozens of call sites build translucent
// tints with them via string concatenation (`${T.violet}18`), which only
// works on a real hex value — `var(--violet)18` is not a valid color.
export const T = {
  bg: "var(--bg)",
  bg2: "var(--bg2)",
  surface: "var(--surface)",
  surface2: "var(--surface2)",
  border: "var(--border)",
  borderLit: "var(--border-lit)",
  text: "var(--text)",
  dim: "var(--dim)",
  faint: "var(--faint)",
  blue: "#4fa98c", // secondary accent — emerald/teal
  blueDim: "#2c4a3f",
  violet: "#74bb7e", // primary accent — forest/moss green
  violetDim: "#3a5540",
  amber: "#e3b462", // warm gold — dappled-light accent
  amberDim: "#6b5730",
} as const;

export type Token = typeof T;

export const fonts = {
  display: "'Space Grotesk', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
} as const;

export const EASE = [0.16, 1, 0.3, 1] as const;

export const scrollOffsets = {
  start: "top 85%",
  end: "top 60%",
} as const;
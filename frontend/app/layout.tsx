import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono, Poppins } from "next/font/google";
import "./globals.css";

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Used only for the STACKLOOP wordmark itself — a heavier, tighter
// geometric sans than the Space Grotesk headings use everywhere else, to
// match the brand logotype (Nav + loading screen).
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-wordmark",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "STACKLOOP — Digital Systems Studio",
  description:
    "We design, build, automate, and deploy complete digital systems — full-stack products, AI agents, agentic workflows and business automation.",
};

// Runs before hydration so a stored "light" preference applies before the
// first paint — otherwise the page would flash dark, then flip to light,
// on every reload for someone who chose light mode.
const themeInitScript = `(function(){try{var t=localStorage.getItem('pf-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${space.variable} ${inter.variable} ${plex.variable} ${poppins.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
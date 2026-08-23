import type { Config } from "tailwindcss";

/**
 * Tailwind configuration for "The Ledger".
 *
 * - Dark, glass-heavy aesthetic (gray-950 base).
 * - Custom gradient keyframes for animated headings (purple -> pink).
 * - Custom animation utilities: marquee (ticker), float, glow.
 * - Framer Motion handles element-level transitions; these add the CSS
 *   keyframe animations that run without JavaScript (typewriter caret, ticker).
 */
const config: Config = {
  darkMode: "class", // dark-first app; we ship the dark theme by default
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0D14", // deep near-black panel base
        paper: "#141824", // card surface
        moss: "#4ade80", // success / present
        brick: "#f87171", // danger / absent
        violet: {
          DEFAULT: "#8b5cf6",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        pinksoft: "#ec4899",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)", // loaded via next/font in layout.tsx
          "system-ui",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "grad-primary":
          "linear-gradient(120deg,#8b5cf6 0%,#ec4899 50%,#ec4899 100%)",
        "grad-soft":
          "linear-gradient(135deg,rgba(139,92,246,.14),rgba(236,72,153,.14))",
      },
      keyframes: {
        // Animated gradient text sweep
        "ledger-gradient": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        // Announcements ticker
        marquee: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(-100%)" },
        },
        // Gentle float for hero ornaments
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        // Typewriter caret blink
        blink: {
          "0%,50%": { opacity: "1" },
          "50.01%,100%": { opacity: "0" },
        },
        // Soft pulsing glow for notifications / live badges
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(139,92,246,.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(139,92,246,0)" },
        },
      },
      animation: {
        "ledger-gradient": "ledger-gradient 6s ease-in-out infinite",
        marquee: "marquee 18s linear infinite",
        float: "float 6s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
        "pulse-glow": "pulseGlow 2.4s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 0 28px rgba(139,92,246,.35)",
        "glow-soft": "0 0 14px rgba(236,72,153,.22)",
        glass: "0 8px 32px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.06)",
      },
      // Backdrop blur for glassmorphism
      backdropBlur: {
        glass: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
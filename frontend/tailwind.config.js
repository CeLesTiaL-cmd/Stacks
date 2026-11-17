const c = (v) => `rgb(var(--${v}) / <alpha-value>)`;
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  future: { hoverOnlyWhenSupported: true },
  theme: { extend: {
    colors: {
      canvas: c("canvas"), surface: c("surface"), raised: c("raised"), ink: c("ink"), muted: c("muted"), subtle: c("subtle"), line: c("line"),
      accent: { DEFAULT: c("accent"), hover: c("accent-hover"), ink: c("accent-ink"), tint: c("accent-tint"), text: c("accent-text") },
      danger: c("danger"), warn: c("warn"),
      tone: { sky: c("tone-sky"), mint: c("tone-mint"), lilac: c("tone-lilac"), amber: c("tone-amber"), rose: c("tone-rose") },
    },
    fontFamily: { display: ["var(--font-display)"], sans: ["var(--font-body)"], mono: ["var(--font-mono)"] },
    boxShadow: {
      soft: "0 1px 2px rgb(var(--shadow) / 0.06), 0 8px 24px -12px rgb(var(--shadow) / 0.18)",
      lift: "0 2px 4px rgb(var(--shadow) / 0.06), 0 18px 40px -16px rgb(var(--shadow) / 0.32)",
    },
    keyframes: { shimmer: { "100%": { transform: "translateX(100%)" } }, floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } } },
    animation: { shimmer: "shimmer 1.6s infinite", floaty: "floaty 7s ease-in-out infinite" },
  } },
  plugins: [],
};

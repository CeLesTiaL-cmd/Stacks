import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../lib/cn.js";

const PATHS = ["M210 30 V560", "M210 140 C210 190 330 160 330 215 V335", "M210 385 C210 430 100 405 100 460 V560"];
const NODES = [
  { x: 210, y: 70, s: "diamond", tone: "sky" }, { x: 210, y: 215, s: "square", tone: "sky" }, { x: 330, y: 215, s: "circle", tone: "lilac" },
  { x: 330, y: 335, s: "circle", tone: "lilac" }, { x: 210, y: 335, s: "diamond", tone: "sky" }, { x: 210, y: 470, s: "square", tone: "sky" },
  { x: 100, y: 460, s: "triangle", tone: "mint" }, { x: 100, y: 545, s: "triangle", tone: "mint" },
];
function Glyph({ s, x, y }) {
  const p = { fill: "none", stroke: "rgb(var(--ink))", strokeWidth: 3, strokeLinejoin: "round" };
  if (s === "diamond") return <path d={`M${x} ${y - 9}L${x + 9} ${y}L${x} ${y + 9}L${x - 9} ${y}Z`} {...p} />;
  if (s === "square") return <rect x={x - 8} y={y - 8} width="16" height="16" {...p} />;
  if (s === "triangle") return <path d={`M${x} ${y - 9}L${x + 9} ${y + 7}L${x - 9} ${y + 7}Z`} {...p} />;
  return <circle cx={x} cy={y} r="7" {...p} />;
}
function MockCard({ className, delay = 0, tone = "sky" }) {
  return (
    <div className={cn("absolute w-[40%] animate-floaty rounded-2xl border border-line bg-raised p-3 shadow-lift", className)} style={{ animationDelay: `${delay}s` }} aria-hidden>
      <div className="flex items-center justify-between"><span className={cn("h-4 w-12 rounded-full", `bg-tone-${tone}/25`)} /><span className="h-3 w-6 rounded-full bg-surface" /></div>
      <div className="mt-3 space-y-1.5"><span className="block h-2.5 w-full rounded bg-ink/80" /><span className="block h-2.5 w-3/4 rounded bg-ink/80" /><span className="mt-2 block h-2 w-full rounded bg-line" /><span className="block h-2 w-2/3 rounded bg-line" /></div>
    </div>
  );
}
export default function GraphMotif({ className }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative mx-auto w-full max-w-[420px]", className)} aria-hidden>
      <svg viewBox="0 0 420 580" className="block h-auto w-full">
        {PATHS.map((d, i) => <motion.path key={d} d={d} fill="none" stroke="rgb(var(--ink))" strokeWidth="3" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: i * 0.3, ease: "easeInOut" }} />)}
        {NODES.map((n, i) => (
          <motion.g key={`${n.x}-${n.y}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.16, duration: 0.4 }}>
            <circle cx={n.x} cy={n.y} r="25" fill="rgb(var(--canvas))" />
            <circle cx={n.x} cy={n.y} r="25" fill={`rgb(var(--tone-${n.tone}) / 0.22)`} stroke="rgb(var(--ink))" strokeWidth="3" />
            <Glyph {...n} />
          </motion.g>
        ))}
      </svg>
      <MockCard className="end-[-4%] top-[6%]" tone="sky" />
      <MockCard className="start-[-6%] top-[52%]" delay={1.6} tone="mint" />
    </div>
  );
}

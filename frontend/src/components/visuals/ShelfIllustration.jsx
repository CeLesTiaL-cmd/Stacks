import { cn } from "../../lib/cn.js";
const GROUPS = [
  { x: 30, books: [[22, 96, "sky"], [18, 76, "amber"], [26, 112, "mint"], [20, 88, "rose"], [24, 104, "lilac"], [18, 70, "sky"], [26, 98, "amber"]] },
  { x: 800, books: [[24, 90, "mint"], [18, 110, "rose"], [22, 80, "lilac"], [26, 100, "sky"], [20, 72, "amber"], [24, 108, "mint"], [18, 86, "rose"], [22, 94, "sky"]] },
];
const FLOOR = 140;
function Spines({ x, books }) {
  let cx = x;
  return books.map(([w, h, tone], i) => {
    const node = (
      <g key={`${x}-${i}`}>
        <rect x={cx} y={FLOOR - h} width={w} height={h} rx="3" fill={`rgb(var(--tone-${tone}) / 0.85)`} />
        <rect x={cx} y={FLOOR - h + 12} width={w} height="3" fill="rgb(var(--ink) / 0.35)" />
        <rect x={cx} y={FLOOR - h + 20} width={w} height="3" fill="rgb(var(--ink) / 0.2)" />
      </g>
    );
    cx += w + 4;
    return node;
  });
}
export default function ShelfIllustration({ className }) {
  return (
    <svg viewBox="0 0 1200 150" preserveAspectRatio="xMidYMax slice" className={cn("pointer-events-none block h-24 w-full sm:h-32 lg:h-36", className)} aria-hidden>
      {GROUPS.map((g) => <Spines key={g.x} {...g} />)}
      <g>
        <rect x="470" y="116" width="150" height="24" rx="4" fill="rgb(var(--tone-sky) / 0.85)" />
        <rect x="482" y="94" width="126" height="22" rx="4" fill="rgb(var(--tone-amber) / 0.9)" />
        <rect x="474" y="74" width="140" height="20" rx="4" fill="rgb(var(--tone-mint) / 0.9)" />
        <g className="animate-floaty" style={{ animationDelay: "0.6s" }}>
          <path d="M544 40l46 18-46 18-46-18 46-18z" fill="rgb(var(--ink))" />
          <path d="M520 66v14c0 6 48 6 48 0V66" fill="none" stroke="rgb(var(--ink))" strokeWidth="5" strokeLinecap="round" />
          <path d="M590 58v22" stroke="rgb(var(--tone-amber))" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
      <g>
        <path d="M1110 140l8-32h28l8 32z" fill="rgb(var(--tone-rose) / 0.85)" />
        <path d="M1132 108c-18-10-20-34-6-46 6 14 10 28 6 46z" fill="rgb(var(--tone-mint))" />
        <path d="M1132 108c14-8 22-26 14-42-8 12-14 26-14 42z" fill="rgb(var(--accent))" />
      </g>
      <rect x="0" y="140" width="1200" height="4" fill="rgb(var(--ink))" />
    </svg>
  );
}

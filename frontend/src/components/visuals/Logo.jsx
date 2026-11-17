import { cn } from "../../lib/cn.js";
export function LogoMark({ className = "size-8" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="rgb(var(--accent))" />
      <path d="M16 7.5l9 4.5-9 4.5L7 12l9-4.5z" fill="rgb(var(--accent-ink))" />
      <path d="M7 16.5l9 4.5 9-4.5" fill="none" stroke="rgb(var(--accent-ink))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".85" />
      <path d="M7 21l9 4.5 9-4.5" fill="none" stroke="rgb(var(--accent-ink))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
    </svg>
  );
}
export default function Logo({ className }) {
  return <span className={cn("inline-flex items-center gap-2 font-display text-xl font-bold tracking-display text-ink", className)}><LogoMark />Stacks</span>;
}

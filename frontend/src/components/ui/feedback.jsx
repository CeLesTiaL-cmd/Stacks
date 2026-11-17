import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { TONE } from "../../lib/fileTypes.js";

const BADGE = { neutral: "bg-surface text-muted", accent: "bg-accent-tint text-accent-text", warn: "bg-warn/15 text-warn", danger: "bg-danger/10 text-danger", ...Object.fromEntries(Object.entries(TONE).map(([k, v]) => [k, `${v.bg} ${v.text}`])) };

export function Badge({ tone = "neutral", className, children, icon: Icon }) {
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", BADGE[tone] || BADGE.neutral, className)}>
      {Icon && <Icon className="size-3 shrink-0" />}<span className="truncate">{children}</span>
    </span>
  );
}
export const Spinner = ({ className }) => <Loader2 className={cn("size-5 animate-spin text-muted", className)} aria-hidden />;
export const Skeleton = ({ className }) => <div className={cn("skeleton", className)} aria-hidden />;
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-raised">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="space-y-3 p-4"><Skeleton className="h-5 w-4/5" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
    </div>
  );
}
export function PageSkeleton() {
  return (
    <div className="container-x py-12" aria-busy="true">
      <Skeleton className="h-9 w-1/3" /><Skeleton className="mt-4 h-5 w-2/3 max-w-xl" />
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
    </div>
  );
}
export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      {Icon && <Icon className="mx-auto mb-3 size-7 text-subtle" />}
      <p className="font-display text-lg font-semibold tracking-display text-ink">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
export function ProgressBar({ value, className }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-surface", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${value}%` }} />
    </div>
  );
}
export function Alert({ tone = "info", children, className }) {
  const tones = { info: "border-tone-sky/30 bg-tone-sky/10 text-ink", warn: "border-warn/30 bg-warn/10 text-ink", danger: "border-danger/30 bg-danger/10 text-ink", success: "border-accent/30 bg-accent-tint text-ink" };
  return <div role="alert" className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone], className)}>{children}</div>;
}

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn.js";

const base = "w-full rounded-xl border border-line bg-raised px-3.5 text-ink placeholder:text-subtle transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60";

export function Field({ label, hint, error, required, children, className }) {
  const id = useId();
  return (
    <div className={cn("block min-w-0", className)}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label} {required && <span className="text-accent-text" aria-hidden>*</span>}</label>}
      {typeof children === "function" ? children(id) : children}
      {error ? <p role="alert" className="mt-1.5 text-xs text-danger">{error}</p> : hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
export const Input = forwardRef(function Input({ className, invalid, ...p }, ref) {
  return <input ref={ref} className={cn(base, "h-11", invalid && "border-danger focus:border-danger focus:ring-danger/25", className)} {...p} />;
});
export const Textarea = forwardRef(function Textarea({ className, invalid, ...p }, ref) {
  return <textarea ref={ref} className={cn(base, "min-h-28 resize-y py-2.5", invalid && "border-danger", className)} {...p} />;
});
export const Select = forwardRef(function Select({ className, children, ...p }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(base, "h-11 appearance-none pe-9", className)} {...p}>{children}</select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
});
export function Switch({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span className="min-w-0"><span className="block text-sm font-medium text-ink">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition", checked ? "border-accent bg-accent" : "border-line bg-surface")}>
        <span className={cn("absolute top-0.5 rounded-full bg-white shadow transition-all", checked ? "start-[1.4rem]" : "start-0.5")} style={{ width: 18, height: 18 }} />
      </button>
    </label>
  );
}

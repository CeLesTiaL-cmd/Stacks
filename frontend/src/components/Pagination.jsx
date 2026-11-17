import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { cn } from "../lib/cn.js";

function windowed(page, pages) {
  const sorted = [...new Set([1, pages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= pages))].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => { if (i && p - sorted[i - 1] > 1) out.push("gap" + p); out.push(p); });
  return out;
}
export default function Pagination({ page, pages, onChange }) {
  const { t, n } = useI18n();
  if (pages <= 1) return null;
  const btn = "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium tabular-nums transition";
  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label={t("common.pagination")}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className={cn(btn, "border border-line disabled:opacity-40")} aria-label={t("common.prev")}><ChevronLeft className="size-4 rtl:rotate-180" /></button>
      {windowed(page, pages).map((p) => typeof p === "string" ? <span key={p} className="px-1 text-muted">…</span> : (
        <button key={p} onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined} className={cn(btn, p === page ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface hover:text-ink")}>{n(p)}</button>
      ))}
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className={cn(btn, "border border-line disabled:opacity-40")} aria-label={t("common.next")}><ChevronRight className="size-4 rtl:rotate-180" /></button>
    </nav>
  );
}

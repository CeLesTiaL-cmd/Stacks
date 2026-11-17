import { cn } from "../../lib/cn.js";
export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn("no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0", className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button key={tab.id} role="tab" aria-selected={active} onClick={() => onChange(tab.id)} className={cn("relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition", active ? "text-ink" : "text-muted hover:text-ink")}>
            {tab.label}
            {tab.badge != null && tab.badge > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-5 text-accent-ink">{tab.badge}</span>}
            {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        );
      })}
    </div>
  );
}

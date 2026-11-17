import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "../lib/cn.js";

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: CircleAlert, info: Info };
const STYLES = { success: "text-accent-text", error: "text-danger", info: "text-tone-sky" };

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);
  const dismiss = useCallback((id) => setItems((l) => l.filter((i) => i.id !== id)), []);
  const push = useCallback((type, message, ms = 4500) => {
    const id = ++idRef.current;
    setItems((l) => [...l.slice(-3), { id, type, message }]);
    if (ms) setTimeout(() => dismiss(id), ms);
  }, [dismiss]);
  const api = useMemo(() => ({ success: (m, ms) => push("success", m, ms), error: (m, ms) => push("error", m, ms ?? 7000), info: (m, ms) => push("info", m, ms) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:p-6">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const Icon = ICONS[item.type];
            return (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.22 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-raised p-3.5 shadow-lift" role="status">
                <Icon className={cn("mt-0.5 size-5 shrink-0", STYLES[item.type])} />
                <p className="min-w-0 flex-1 break-words text-sm text-ink">{item.message}</p>
                <button type="button" onClick={() => dismiss(item.id)} className="rounded-md p-0.5 text-muted transition hover:text-ink" aria-label="Close"><X className="size-4" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

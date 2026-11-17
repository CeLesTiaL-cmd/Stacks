import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/cn.js";
import { useClickOutside } from "../../lib/useClickOutside.js";

export default function Popover({ trigger, children, align = "end", className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, onClick: () => setOpen((v) => !v), "aria-expanded": open, "aria-haspopup": "menu" })}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.15 }}
            className={cn("absolute top-full z-50 mt-2 min-w-48 rounded-2xl border border-line bg-raised p-1.5 shadow-lift", align === "end" ? "end-0" : "start-0", className)}>
            {children(close)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export const menuItem = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-sm text-ink transition hover:bg-surface";

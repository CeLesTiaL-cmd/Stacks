import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { useScrollLock } from "../../lib/useScrollLock.js";
import { useI18n } from "../../i18n/index.jsx";
import Button from "./Button.jsx";

export function Modal({ open, onClose, title, children, footer, size = "md" }) {
  const { t } = useI18n();
  const panel = useRef(null);
  useScrollLock(open);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} data-lenis-prevent
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn("relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-raised shadow-lift outline-none sm:rounded-3xl", size === "lg" ? "sm:max-w-2xl" : size === "sm" ? "sm:max-w-sm" : "sm:max-w-lg")}>
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h2 className="min-w-0 truncate font-display text-lg font-semibold tracking-display">{title}</h2>
              <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted transition hover:bg-surface hover:text-ink" aria-label={t("common.close")}><X className="size-5" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5" data-lenis-prevent>{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel, loading, danger = true }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={<><Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button><Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel || t("common.confirm")}</Button></>}>
      <p className="text-sm text-muted">{text}</p>
    </Modal>
  );
}

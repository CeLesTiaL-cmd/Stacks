import { Monitor, Moon, Sun, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import Popover, { menuItem } from "./ui/Popover.jsx";
import { cn } from "../lib/cn.js";

const OPTIONS = [{ id: "light", icon: Sun, key: "theme.light" }, { id: "dark", icon: Moon, key: "theme.dark" }, { id: "system", icon: Monitor, key: "theme.system" }];

export default function ThemeToggle({ inline = false }) {
  const { mode, resolved, setMode } = useTheme();
  const { t } = useI18n();
  if (inline) {
    return (
      <div className="grid grid-cols-3 gap-1 rounded-full border border-line bg-surface p-1" role="radiogroup" aria-label={t("theme.label")}>
        {OPTIONS.map(({ id, icon: Icon, key }) => (
          <button key={id} role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={cn("flex items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-medium transition", mode === id ? "bg-raised text-ink shadow-soft" : "text-muted")}>
            <Icon className="size-4" />{t(key)}
          </button>
        ))}
      </div>
    );
  }
  const Current = resolved === "dark" ? Moon : Sun;
  return (
    <Popover trigger={(p) => <button type="button" {...p} className="inline-flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-ink" aria-label={t("theme.label")}><Current className="size-5" /></button>}>
      {(close) => OPTIONS.map(({ id, icon: Icon, key }) => (
        <button key={id} className={menuItem} onClick={() => { setMode(id); close(); }}>
          <Icon className="size-4 text-muted" /><span className="flex-1">{t(key)}</span>{mode === id && <Check className="size-4 text-accent-text" />}
        </button>
      ))}
    </Popover>
  );
}

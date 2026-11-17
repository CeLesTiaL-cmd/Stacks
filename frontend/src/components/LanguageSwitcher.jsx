import { Check, Globe } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import Popover, { menuItem } from "./ui/Popover.jsx";
import { cn } from "../lib/cn.js";

export default function LanguageSwitcher({ inline = false }) {
  const { lang, setLang, languages, t } = useI18n();
  if (inline) {
    return (
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={t("lang.label")}>
        {languages.map((l) => (
          <button key={l.code} role="radio" aria-checked={lang === l.code} onClick={() => setLang(l.code)} className={cn("rounded-xl border px-3 py-2 text-start text-sm transition", lang === l.code ? "border-accent bg-accent-tint text-accent-text" : "border-line text-ink hover:bg-surface")}>{l.native}</button>
        ))}
      </div>
    );
  }
  return (
    <Popover trigger={(p) => <button type="button" {...p} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink" aria-label={t("lang.label")}><Globe className="size-[18px]" /><span className="uppercase">{lang}</span></button>}>
      {(close) => languages.map((l) => (
        <button key={l.code} className={menuItem} onClick={() => { setLang(l.code); close(); }} lang={l.code}>
          <span className="flex-1">{l.native}</span>{lang === l.code && <Check className="size-4 text-accent-text" />}
        </button>
      ))}
    </Popover>
  );
}

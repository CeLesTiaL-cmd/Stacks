import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./en.js";

export const LANGUAGES = [
  { code: "en", native: "English", dir: "ltr", locale: "en-US" },
  { code: "bn", native: "বাংলা", dir: "ltr", locale: "bn-BD" },
  { code: "fr", native: "Français", dir: "ltr", locale: "fr-FR" },
  { code: "es", native: "Español", dir: "ltr", locale: "es-ES" },
  { code: "hi", native: "हिन्दी", dir: "ltr", locale: "hi-IN" },
  { code: "ar", native: "العربية", dir: "rtl", locale: "ar" },
];
const LOADERS = { bn: () => import("./bn.js"), fr: () => import("./fr.js"), es: () => import("./es.js"), hi: () => import("./hi.js"), ar: () => import("./ar.js") };
const FONT_LINKS = {
  bn: "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap",
  hi: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap",
  ar: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap",
};

function detectInitial() {
  try {
    const saved = localStorage.getItem("stacks-lang");
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
    for (const p of navigator.languages || [navigator.language]) {
      const code = String(p).slice(0, 2).toLowerCase();
      if (LANGUAGES.some((l) => l.code === code)) return code;
    }
  } catch { /* ignore */ }
  return "en";
}
function ensureFont(code) {
  const href = FONT_LINKS[code];
  if (!href || document.querySelector(`link[data-lang-font="${code}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet"; link.href = href; link.dataset.langFont = code;
  document.head.appendChild(link);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial);
  const [dict, setDict] = useState(en);
  const [ready, setReady] = useState(lang === "en");
  const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    let cancelled = false;
    ensureFont(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
    if (lang === "en") { setDict(en); setReady(true); return undefined; }
    LOADERS[lang]().then((m) => { if (!cancelled) { setDict(m.default); setReady(true); } })
      .catch(() => { if (!cancelled) { setDict(en); setReady(true); } });
    return () => { cancelled = true; };
  }, [lang, meta.dir]);

  const setLang = useCallback((code) => { try { localStorage.setItem("stacks-lang", code); } catch { /* ignore */ } setLangState(code); }, []);
  const t = useCallback((key, vars) => {
    let s = dict[key] ?? en[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
    return s;
  }, [dict]);

  const value = useMemo(() => ({
    t, lang, setLang, dir: meta.dir, locale: meta.locale, languages: LANGUAGES,
    n: (num) => new Intl.NumberFormat(meta.locale).format(Number(num) || 0),
    d: (date, opts = { year: "numeric", month: "short", day: "numeric" }) => {
      const dt = new Date(date);
      return Number.isNaN(dt.getTime()) ? "" : new Intl.DateTimeFormat(meta.locale, opts).format(dt);
    },
  }), [t, lang, setLang, meta]);

  if (!ready) return null;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

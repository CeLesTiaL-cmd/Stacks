import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
const ThemeContext = createContext(null);
const KEY = "stacks-theme";

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => { try { return localStorage.getItem(KEY) || "system"; } catch { return "system"; } });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  useEffect(() => { document.documentElement.classList.toggle("dark", resolved === "dark"); }, [resolved]);
  const setMode = useCallback((m) => { try { localStorage.setItem(KEY, m); } catch { /* ignore */ } setModeState(m); }, []);
  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

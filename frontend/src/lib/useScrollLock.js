import { useEffect } from "react";
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const lenis = window.__lenis;
    lenis?.stop();
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; lenis?.start(); };
  }, [active]);
}

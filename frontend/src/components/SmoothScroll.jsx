import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import { useReducedMotion } from "motion/react";

/** Lenis momentum scrolling on desktop pointers; native scrolling on touch and reduced-motion. */
export default function SmoothScroll() {
  const reduce = useReducedMotion();
  const { pathname } = useLocation();
  useEffect(() => {
    if (reduce || window.matchMedia("(pointer: coarse)").matches) return undefined;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.11, wheelMultiplier: 0.95 });
    window.__lenis = lenis;
    return () => { lenis.destroy(); delete window.__lenis; };
  }, [reduce]);
  useEffect(() => { if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); }, [pathname]);
  return null;
}

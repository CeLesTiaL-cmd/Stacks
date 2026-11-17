import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";

export function Reveal({ children, delay = 0, y = 18, className }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={`min-w-0 ${className || ""}`}>{children}</div>;
  return (
    <motion.div className={`min-w-0 ${className || ""}`} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -60px 0px" }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
export function CountUp({ value, format = (v) => v }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) { setV(value); return undefined; }
    const c = animate(0, value, { duration: 1.2, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, value, reduce]);
  return <span ref={ref}>{format(v)}</span>;
}
export function Magnetic({ children, strength = 0.25, className }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 }), sy = useSpring(y, { stiffness: 220, damping: 18 });
  const ref = useRef(null);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ x: sx, y: sy }}
      onPointerMove={(e) => { if (e.pointerType !== "mouse" || !ref.current) return; const r = ref.current.getBoundingClientRect(); x.set((e.clientX - (r.left + r.width / 2)) * strength); y.set((e.clientY - (r.top + r.height / 2)) * strength); }}
      onPointerLeave={() => { x.set(0); y.set(0); }}>
      {children}
    </motion.div>
  );
}

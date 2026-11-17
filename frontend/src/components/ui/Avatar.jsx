import { useState } from "react";
import { cn } from "../../lib/cn.js";
import { hashString, initials } from "../../lib/format.js";
const TONES = ["bg-tone-sky/20 text-tone-sky", "bg-tone-mint/20 text-tone-mint", "bg-tone-lilac/20 text-tone-lilac", "bg-tone-amber/20 text-tone-amber", "bg-tone-rose/20 text-tone-rose"];

export default function Avatar({ src, name = "", size = 36, className }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.38) };
  if (src && !broken) return <img src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} style={style} className={cn("shrink-0 rounded-full object-cover ring-1 ring-line", className)} />;
  return <span style={style} className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", TONES[hashString(name) % TONES.length], className)} aria-hidden>{initials(name)}</span>;
}

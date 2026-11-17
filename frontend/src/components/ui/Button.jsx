import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn.js";

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover shadow-soft",
  secondary: "border border-line bg-raised text-ink hover:border-ink/40 hover:bg-surface",
  ghost: "text-ink hover:bg-surface",
  danger: "bg-danger text-white hover:opacity-90",
  outlineDanger: "border border-danger/40 text-danger hover:bg-danger/10",
  github: "bg-ink text-canvas hover:opacity-85",
  google: "border border-line bg-raised text-ink hover:border-ink/40 hover:bg-surface",
};
const SIZES = { sm: "h-9 gap-1.5 px-3.5 text-sm", md: "h-11 gap-2 px-5 text-sm", lg: "h-12 gap-2.5 px-6 text-base", icon: "size-10" };

const Button = forwardRef(function Button({ variant = "primary", size = "md", loading = false, to, href, className, children, iconStart, iconEnd, disabled, ...props }, ref) {
  const Comp = to ? Link : href ? "a" : "button";
  const cls = cn("group relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-full font-medium transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50", VARIANTS[variant], SIZES[size], className);
  const extra = Comp === "button" ? { type: props.type || "button", disabled: disabled || loading } : {};
  return (
    <Comp ref={ref} to={to} href={href} className={cls} {...extra} {...props}>
      {variant === "primary" && <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full skew-x-[-20deg] bg-white/25 opacity-0 transition duration-700 group-hover:translate-x-[330%] group-hover:opacity-100" />}
      {loading ? <Loader2 className="relative size-4 animate-spin" /> : iconStart}
      {children != null && <span className="relative">{children}</span>}
      {iconEnd && <span className="relative transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">{iconEnd}</span>}
    </Comp>
  );
});
export default Button;

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { LayoutDashboard, LogOut, Menu, Plus, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { useScrollLock } from "../lib/useScrollLock.js";
import { cn } from "../lib/cn.js";
import Logo from "./visuals/Logo.jsx";
import Button from "./ui/Button.jsx";
import Avatar from "./ui/Avatar.jsx";
import Popover, { menuItem } from "./ui/Popover.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

const linkCls = ({ isActive }) => cn("rounded-full px-3.5 py-2 text-sm font-medium transition", isActive ? "bg-surface text-ink" : "text-muted hover:text-ink");
const drawerLink = "rounded-xl px-3 py-3 font-display text-xl font-semibold tracking-display text-ink/80 transition hover:bg-surface";

export default function Navbar() {
  const { t, dir } = useI18n();
  const { profile, firebaseUser, logout, isModerator } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  useScrollLock(open);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const links = [
    { to: "/discover", label: t("nav.discover") },
    { to: "/leaderboard", label: t("nav.leaderboard") },
    ...(firebaseUser ? [{ to: "/upload", label: t("nav.upload") }] : []),
    ...(isModerator ? [{ to: "/admin", label: t("nav.admin") }] : []),
  ];
  const submit = (e) => { e.preventDefault(); navigate(q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : "/discover"); setOpen(false); };
  const signOut = async () => { await logout(); navigate("/"); };

  const searchForm = (cls) => (
    <form onSubmit={submit} className={cls} role="search">
      <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
      <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder={t("nav.searchPlaceholder")} aria-label={t("nav.search")}
        className="h-10 w-full rounded-full border border-line bg-surface ps-10 pe-4 text-sm text-ink placeholder:text-subtle transition focus:border-accent focus:bg-raised focus:outline-none focus:ring-2 focus:ring-accent/25" />
    </form>
  );

  return (
    <header className={cn("sticky top-0 z-40 border-b transition-colors duration-300", scrolled ? "border-line bg-canvas/85 backdrop-blur-lg" : "border-transparent bg-canvas")}>
      <div className="container-x flex h-16 items-center gap-3 lg:gap-5">
        <Link to="/" aria-label="Stacks" className="shrink-0 rounded-lg"><Logo /></Link>
        <nav className="ms-2 hidden items-center gap-1 md:flex" aria-label="Primary">{links.map((l) => <NavLink key={l.to} to={l.to} className={linkCls}>{l.label}</NavLink>)}</nav>
        <div className="flex-1" />
        {searchForm("relative hidden w-56 transition-[width] duration-300 focus-within:w-72 lg:block")}
        <div className="hidden items-center gap-1 md:flex"><LanguageSwitcher /><ThemeToggle /></div>

        {firebaseUser ? (
          <div className="hidden md:block">
            <Popover trigger={(p) => (
              <button type="button" {...p} className="flex items-center gap-2 rounded-full border border-line py-1 ps-1 pe-3 text-sm transition hover:border-ink/40" aria-label={t("nav.account")}>
                <Avatar src={profile?.avatarUrl} name={profile?.name} size={30} /><span className="max-w-24 truncate font-medium">{profile?.name?.split(" ")[0]}</span>
              </button>)}>
              {(close) => (<>
                <Link to={`/profile/${profile?._id}`} onClick={close} className={menuItem}><UserRound className="size-4 text-muted" />{t("nav.profile")}</Link>
                <Link to="/dashboard" onClick={close} className={menuItem}><LayoutDashboard className="size-4 text-muted" />{t("nav.dashboard")}</Link>
                {isModerator && <Link to="/admin" onClick={close} className={menuItem}><ShieldCheck className="size-4 text-muted" />{t("nav.admin")}</Link>}
                <button onClick={() => { close(); signOut(); }} className={menuItem}><LogOut className="size-4 text-muted" />{t("nav.signout")}</button>
              </>)}
            </Popover>
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex"><Button to="/login" variant="ghost" size="sm">{t("nav.signin")}</Button><Button to="/register" size="sm">{t("nav.join")}</Button></div>
        )}

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button type="button" onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-surface" aria-label={t("nav.menu")} aria-expanded={open}><Menu className="size-6" /></button>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[80] md:hidden">
              <motion.div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <motion.aside data-lenis-prevent initial={{ x: dir === "rtl" ? "-100%" : "100%" }} animate={{ x: 0 }} exit={{ x: dir === "rtl" ? "-100%" : "100%" }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-y-0 end-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-canvas p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lift" aria-label={t("nav.menu")}>
                <div className="mb-5 flex items-center justify-between"><Logo /><button onClick={() => setOpen(false)} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface" aria-label={t("common.close")}><X className="size-6" /></button></div>
                {searchForm("relative mb-4")}
                <nav className="flex flex-col" aria-label="Mobile">
                  {links.map((l) => <NavLink key={l.to} to={l.to} className={({ isActive }) => cn(drawerLink, isActive && "bg-surface text-ink")}>{l.label}</NavLink>)}
                  {firebaseUser && (<><NavLink to="/dashboard" className={drawerLink}>{t("nav.dashboard")}</NavLink><NavLink to={`/profile/${profile?._id}`} className={drawerLink}>{t("nav.profile")}</NavLink></>)}
                </nav>
                <div className="mt-6 space-y-5 border-t border-line pt-5">
                  <div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{t("lang.label")}</p><LanguageSwitcher inline /></div>
                  <div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{t("theme.label")}</p><ThemeToggle inline /></div>
                </div>
                <div className="mt-auto flex flex-col gap-2 pt-6">
                  {firebaseUser ? (<><Button to="/upload" iconStart={<Plus className="size-4" />}>{t("nav.upload")}</Button><Button variant="secondary" onClick={signOut} iconStart={<LogOut className="size-4" />}>{t("nav.signout")}</Button></>)
                    : (<><Button to="/register">{t("nav.join")}</Button><Button to="/login" variant="secondary">{t("nav.signin")}</Button></>)}
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>, document.body)}
    </header>
  );
}

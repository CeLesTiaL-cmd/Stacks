import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import Logo from "./visuals/Logo.jsx";

export default function Footer() {
  const { t } = useI18n();
  const { firebaseUser } = useAuth();
  const col = "flex flex-col gap-2.5 text-sm text-muted [&_a:hover]:text-ink";
  const head = "mb-1 font-mono text-xs uppercase tracking-[0.14em] text-subtle";
  return (
    <footer className="mt-10 border-t border-line">
      <div className="container-x grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm"><Logo /><p className="mt-3 text-sm text-muted">{t("footer.tagline")}</p></div>
        <nav className={col} aria-label={t("footer.explore")}><p className={head}>{t("footer.explore")}</p><Link to="/discover">{t("nav.discover")}</Link><Link to="/leaderboard">{t("nav.leaderboard")}</Link><Link to="/resources">{t("nav.resources")}</Link><Link to="/upload">{t("nav.upload")}</Link></nav>
        <nav className={col} aria-label={t("footer.account")}><p className={head}>{t("footer.account")}</p>{firebaseUser ? <Link to="/dashboard">{t("nav.dashboard")}</Link> : (<><Link to="/login">{t("nav.signin")}</Link><Link to="/register">{t("nav.join")}</Link></>)}</nav>
      </div>
      <div className="border-t border-line"><div className="container-x flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted">
        <p>© {new Date().getFullYear()} Stacks. {t("footer.rights")}</p>
      </div></div>
    </footer>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { useToast } from "../context/ToastContext.jsx";
import AuthShell from "./AuthShell.jsx";
import { Divider, SocialButtons, authErrorKey } from "./authShared.jsx";
import { Field, Input } from "../components/ui/form.jsx";
import { Alert } from "../components/ui/feedback.jsx";
import Button from "../components/ui/Button.jsx";

export default function Login() {
  const { t } = useI18n();
  const toast = useToast();
  const { login, loginWithGoogle, loginWithGithub, resetPassword } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from?.pathname || "/";
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [show, setShow] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setError(""); setBusy(true);
    try { await fn(); navigate(from, { replace: true }); }
    catch (err) { const key = authErrorKey(err); if (key) setError(t(key)); }
    finally { setBusy(false); }
  };
  const reset = async () => {
    if (!email) return setError(t("auth.err.needEmail"));
    try { await resetPassword(email); toast.success(t("auth.resetSent")); } catch (err) { setError(t(authErrorKey(err) || "auth.err.generic")); }
  };

  return (
    <AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSub")}>
      <SocialButtons busy={busy} onGoogle={() => run(loginWithGoogle)} onGithub={() => run(loginWithGithub)} />
      <Divider>{t("auth.or")}</Divider>
      <form onSubmit={(e) => { e.preventDefault(); run(() => login(email, password)); }} className="space-y-4" noValidate>
        <Field label={t("auth.email")}>{(id) => (
          <div className="relative"><Mail className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" /><Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="ps-10" /></div>
        )}</Field>
        <Field label={t("auth.password")}>{(id) => (
          <div className="relative"><Input id={id} type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pe-11" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:text-ink" aria-label={t("auth.togglePw")}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
        )}</Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" className="w-full" loading={busy}>{t("nav.signin")}</Button>
        <button type="button" onClick={reset} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">{t("auth.forgot")}</button>
      </form>
      <p className="mt-8 text-sm text-muted">{t("auth.noAccount")} <Link to="/register" className="font-medium text-accent-text underline-offset-4 hover:underline">{t("auth.createOne")}</Link></p>
    </AuthShell>
  );
}

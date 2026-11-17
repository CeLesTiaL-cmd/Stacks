import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { useToast } from "../context/ToastContext.jsx";
import AuthShell from "./AuthShell.jsx";
import { Divider, SocialButtons, authErrorKey } from "./authShared.jsx";
import { Field, Input } from "../components/ui/form.jsx";
import { Alert } from "../components/ui/feedback.jsx";
import Button from "../components/ui/Button.jsx";

export default function Register() {
  const { t } = useI18n();
  const toast = useToast();
  const { register, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [show, setShow] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  const run = async (fn, verify) => {
    setError(""); setBusy(true);
    try { await fn(); if (verify) toast.info(t("auth.verifySent")); navigate("/dashboard", { replace: true }); }
    catch (err) { const key = authErrorKey(err); if (key) setError(t(key)); }
    finally { setBusy(false); }
  };
  const submit = (e) => { e.preventDefault(); if (password.length < 6) return setError(t("auth.err.weak")); run(() => register(name.trim(), email, password), true); };
  const icon = "pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle";

  return (
    <AuthShell title={t("auth.registerTitle")} subtitle={t("auth.registerSub")}>
      <SocialButtons busy={busy} onGoogle={() => run(loginWithGoogle)} onGithub={() => run(loginWithGithub)} />
      <Divider>{t("auth.or")}</Divider>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t("auth.name")}>{(id) => <div className="relative"><UserRound className={icon} /><Input id={id} autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className="ps-10" /></div>}</Field>
        <Field label={t("auth.email")}>{(id) => <div className="relative"><Mail className={icon} /><Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="ps-10" /></div>}</Field>
        <Field label={t("auth.password")} hint={t("auth.pwHint")}>{(id) => (
          <div className="relative"><Input id={id} type={show ? "text" : "password"} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pe-11" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:text-ink" aria-label={t("auth.togglePw")}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
        )}</Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" className="w-full" loading={busy}>{t("auth.createAccount")}</Button>
      </form>
      <p className="mt-8 text-sm text-muted">{t("auth.haveAccount")} <Link to="/login" className="font-medium text-accent-text underline-offset-4 hover:underline">{t("nav.signin")}</Link></p>
    </AuthShell>
  );
}

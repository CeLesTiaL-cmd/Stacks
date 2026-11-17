import { GitHubIcon, GoogleIcon } from "../components/ui/BrandIcons.jsx";
import Button from "../components/ui/Button.jsx";

export function authErrorKey(err) {
  const c = err?.code || "";
  if (c.includes("popup-closed") || c.includes("cancelled-popup")) return null;
  if (c.includes("wrong-password") || c.includes("invalid-credential") || c.includes("invalid-login")) return "auth.err.invalid";
  if (c.includes("user-not-found")) return "auth.err.notFound";
  if (c.includes("too-many-requests")) return "auth.err.tooMany";
  if (c.includes("email-already-in-use")) return "auth.err.inUse";
  if (c.includes("weak-password")) return "auth.err.weak";
  if (c.includes("account-exists")) return "auth.err.exists";
  if (c.includes("network")) return "err.network";
  if (c.includes("popup-blocked")) return "auth.err.popup";
  return "auth.err.generic";
}
export function SocialButtons({ onGoogle, onGithub, busy }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <Button variant="github" onClick={onGithub} disabled={busy} iconStart={<GitHubIcon />}>GitHub</Button>
      <Button variant="google" onClick={onGoogle} disabled={busy} iconStart={<GoogleIcon />}>Google</Button>
    </div>
  );
}
export function Divider({ children }) {
  return <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-subtle"><span className="h-px flex-1 bg-line" />{children}<span className="h-px flex-1 bg-line" /></div>;
}

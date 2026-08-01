import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, loginWithGoogle, loginWithGithub, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleProvider(fn) {
    setError("");
    setBusy(true);
    try {
      await fn();
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email) {
      setError("Enter your email above first, then click reset password.");
      return;
    }
    await resetPassword(email);
    setResetSent(true);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-2xl text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Welcome back to Stacks.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {resetSent && <p className="text-sm text-accent">Password reset email sent.</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-canvas hover:bg-accent-dark disabled:opacity-50"
        >
          Sign in
        </button>

        <button type="button" onClick={handleReset} className="block text-sm text-muted hover:text-accent">
          Forgot password?
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or continue with
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2">
        <button
          onClick={() => handleProvider(loginWithGoogle)}
          className="w-full rounded-md border border-line py-2.5 text-sm text-ink hover:border-accent"
        >
          Continue with Google
        </button>
        <button
          onClick={() => handleProvider(loginWithGithub)}
          className="w-full rounded-md border border-line py-2.5 text-sm text-ink hover:border-accent"
        >
          Continue with GitHub
        </button>
      </div>

      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link to="/register" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function friendlyError(err) {
  const code = err?.code || "";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Incorrect email or password.";
  if (code.includes("user-not-found")) return "No account found with that email.";
  if (code.includes("too-many-requests")) return "Too many attempts — try again shortly.";
  return "Something went wrong signing in. Please try again.";
}

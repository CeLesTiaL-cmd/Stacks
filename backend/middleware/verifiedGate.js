import { requireAuth } from "./auth.js";

/**
 * Optional production hardening. Set REQUIRE_VERIFIED_EMAIL=true on Render and only people with a
 * verified email can upload, comment or use the AI (stops throw-away spam accounts).
 */
export const verifiedGate = [
  requireAuth,
  (req, res, next) => {
    if (process.env.REQUIRE_VERIFIED_EMAIL !== "true") return next();
    if (req.firebaseToken?.email_verified) return next();
    return res.status(403).json({ error: "Please verify your email address first (check your inbox, or resend it from Dashboard → Settings)." });
  },
];

import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";

/**
 * Verifies the Firebase ID token sent in the Authorization header
 * (format: "Bearer <token>"), then attaches the matching Mongo user
 * document to req.user. Creates the Mongo user on first sign-in.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Missing Authorization bearer token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email || `${decoded.uid}@unknown.local`,
        name: decoded.name || decoded.email?.split("@")[0] || "New User",
        avatarUrl: decoded.picture || "",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: "This account has been suspended" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Like requireAuth, but does not fail if no token is present (req.user stays undefined). */
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  return requireAuth(req, res, next);
}

/** Restricts a route to one or more roles, e.g. requireRole("admin", "moderator") */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to do this" });
    }
    next();
  };
}

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";
import { cacheFor, errorHandler, gzipJson, installAsyncErrorForwarding, sanitizeInput } from "./middleware/hardening.js";

import usersRoutes from "./routes/users.js";
import contentRoutes from "./routes/content.js";
import commentsRoutes from "./routes/comments.js";
import adminRoutes from "./routes/admin.js";
import adminExtraRoutes from "./routes/adminExtra.js";
import statsRoutes from "./routes/stats.js";
import commentsPlusRoutes from "./routes/commentsPlus.js";
import aiRoutes from "./routes/ai.js";
import { verifiedGate } from "./middleware/verifiedGate.js";

await installAsyncErrorForwarding();

const app = express();
app.set("trust proxy", 1); // behind Render's proxy: without this every visitor shares ONE rate-limit bucket

const allowed = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()).filter(Boolean);
const MAX_MB = Number(process.env.MAX_FILE_SIZE_MB || 50);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)), credentials: true }));
app.use(gzipJson);
app.use(express.json({ limit: "2mb" }));
app.use(sanitizeInput);

const limiter = (windowMs, max) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests. Please wait a moment." } });
app.use("/api", limiter(15 * 60 * 1000, 600));
app.post("/api/content", limiter(30 * 60 * 1000, 20));
app.post("/api/comments/content/:contentId", limiter(10 * 60 * 1000, 30));
app.use("/api/ai", limiter(60 * 1000, 20));
app.post(["/api/content", "/api/comments/content/:contentId", "/api/ai/chat", "/api/ai/summary"], ...verifiedGate);

// Public, identical-for-everyone responses can be cached briefly.
app.get(["/api/content/filters", "/api/content/leaderboard", "/api/users/leaderboard"], cacheFor(60));

app.get("/api/health", (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1, time: new Date().toISOString() }));

app.use("/api/stats", statsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/comments", commentsPlusRoutes); // upvotes + masked staff identity, before the original router
app.use("/api/comments", commentsRoutes);
app.use("/api/admin", adminExtraRoutes); // stricter routes first
app.use("/api/admin", adminRoutes);

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler(MAX_MB));

process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));

const PORT = process.env.PORT || 5000;
async function start() {
  initFirebaseAdmin();
  await connectDB();
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}
start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

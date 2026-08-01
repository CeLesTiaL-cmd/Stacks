import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

import { connectDB } from "./config/db.js";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";

import usersRoutes from "./routes/users.js";
import contentRoutes from "./routes/content.js";
import commentsRoutes from "./routes/comments.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false })); // allow serving uploaded files cross-origin
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

// Basic abuse protection on the public API
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Serve uploaded files (thumbnails, previews, downloadable files, avatars)
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/users", usersRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/admin", adminRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err?.message?.includes("File too large")) {
    return res.status(413).json({ error: "File is too large" });
  }
  res.status(500).json({ error: "Something went wrong on the server" });
});

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

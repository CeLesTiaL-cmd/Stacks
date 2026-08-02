import express from "express";
import User from "../models/User.js";
import Content from "../models/Content.js";
import Bookmark from "../models/Bookmark.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// GET /api/users/me — the logged in user's own full profile
router.get("/me", requireAuth, async (req, res) => {
  res.json(req.user);
});

// PATCH /api/users/me — update own profile fields
router.patch("/me", requireAuth, async (req, res) => {
  const allowed = [
    "name",
    "bio",
    "country",
    "university",
    "department",
    "degree",
    "semester",
    "researchInterests",
    "skills",
    "website",
    "github",
    "linkedin",
    "portfolio",
    "privacy",
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json(user);
});

// POST /api/users/me/avatar — upload avatar or cover image
router.post(
  "/me/avatar",
  requireAuth,
  upload.fields([{ name: "avatar", maxCount: 1 }, { name: "cover", maxCount: 1 }]),
  async (req, res) => {
    const updates = {};
    if (req.files?.avatar?.[0]) updates.avatarUrl = req.files.avatar[0].path;
    if (req.files?.cover?.[0]) updates.coverUrl = req.files.cover[0].path;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  }
);

// GET /api/users/me/dashboard — uploads grouped by status, bookmarks
router.get("/me/dashboard", requireAuth, async (req, res) => {
  const [uploads, bookmarks] = await Promise.all([
    Content.find({ uploader: req.user._id }).sort({ createdAt: -1 }),
    Bookmark.find({ user: req.user._id }).populate("content"),
  ]);

  res.json({
    uploads,
    bookmarks: bookmarks.map((b) => b.content).filter(Boolean),
  });
});

// GET /api/users/:id — public profile (respects privacy settings)
router.get("/:id", optionalAuth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const isOwner = req.user && String(req.user._id) === String(user._id);

  if (user.privacy.profileVisibility === "private" && !isOwner) {
    return res.status(403).json({ error: "This profile is private" });
  }

  const profile = user.toObject();
  if (user.privacy.hideStatistics && !isOwner) delete profile.stats;
  if (user.privacy.hideFollowers && !isOwner) {
    delete profile.stats?.followersCount;
    delete profile.stats?.followingCount;
  }

  let uploads = [];
  if (!user.privacy.hideUploadHistory || isOwner) {
    uploads = await Content.find({ uploader: user._id, status: "approved" }).sort({
      createdAt: -1,
    });
  }

  res.json({ profile, uploads });
});

export default router;
import express from "express";
import Comment from "../models/Comment.js";
import Content from "../models/Content.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { canViewContent } from "../middleware/contentAccess.js";

const router = express.Router();

// GET /api/comments/content/:contentId
router.get("/content/:contentId", optionalAuth, async (req, res) => {
  const content = await Content.findById(req.params.contentId);
  if (!canViewContent(content, req.user, req.firebaseToken?.email_verified)) return res.status(404).json({ error: "Content not found" });
  const comments = await Comment.find({ content: req.params.contentId })
    .sort({ isPinned: -1, createdAt: 1 })
    .populate("author", "name avatarUrl role");
  res.json(comments);
});

// POST /api/comments/content/:contentId
router.post("/content/:contentId", requireAuth, async (req, res) => {
  const { body, parentComment } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: "Comment cannot be empty" });

  const content = await Content.findById(req.params.contentId);
  if (!canViewContent(content, req.user, req.firebaseToken?.email_verified)) return res.status(404).json({ error: "Content not found" });

  const comment = await Comment.create({
    content: content._id,
    author: req.user._id,
    parentComment: parentComment || null,
    body: body.trim(),
    isAuthorReply: String(content.uploader) === String(req.user._id),
    isModeratorReply: ["admin", "moderator"].includes(req.user.role),
  });

  content.counts.comments += 1;
  await content.save();

  const populated = await comment.populate("author", "name avatarUrl role");
  res.status(201).json(populated);
});

// PATCH /api/comments/:id/pin — author of content or moderator can pin
router.patch("/:id/pin", requireAuth, async (req, res) => {
  const comment = await Comment.findById(req.params.id).populate("content");
  if (!comment) return res.status(404).json({ error: "Not found" });

  const isContentOwner = String(comment.content.uploader) === String(req.user._id);
  const isStaff = ["admin", "moderator"].includes(req.user.role);
  if (!isContentOwner && !isStaff) return res.status(403).json({ error: "Not allowed" });

  comment.isPinned = !comment.isPinned;
  await comment.save();
  res.json(comment);
});

// DELETE /api/comments/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ error: "Not found" });

  const isOwner = String(comment.author) === String(req.user._id);
  const isStaff = ["admin", "moderator"].includes(req.user.role);
  if (!isOwner && !isStaff) return res.status(403).json({ error: "Not allowed" });

  await comment.deleteOne();
  await Content.findByIdAndUpdate(comment.content, { $inc: { "counts.comments": -1 } });
  res.json({ ok: true });
});

export default router;

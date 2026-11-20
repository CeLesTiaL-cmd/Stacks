import express from "express";
import mongoose from "mongoose";
import Content from "../models/Content.js";
import Comment from "../models/Comment.js";
import CommentVote from "../models/CommentVote.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { canViewContent } from "../middleware/contentAccess.js";

/** Staff never appear under their personal name in discussions. */
export function maskAuthor(author) {
  if (!author) return { _id: "deleted", name: "Deleted user", avatarUrl: "" };
  if (author.role === "admin" || author.role === "moderator") {
    return { _id: "staff", name: author.role === "admin" ? "Stacks Admin" : "Stacks Moderator", avatarUrl: "", isStaff: true };
  }
  return { _id: author._id, name: author.name, avatarUrl: author.avatarUrl };
}

export function createCommentsPlusRouter(deps = {}) {
  const D = { Content, Comment, CommentVote, requireAuth, optionalAuth, canViewContent, ...deps };
  const router = express.Router();
  const verified = (req) => Boolean(req.firebaseToken?.email_verified);

  // Replaces the old list route: same data, plus upvotes and masked staff identities.
  router.get("/content/:contentId", D.optionalAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.contentId)) return res.status(400).json({ error: "Invalid id" });
    const content = await D.Content.findById(req.params.contentId).select("status visibility uploader institutionDomain authorizedEmails");
    if (!content || !D.canViewContent(content, req.user, verified(req))) return res.status(404).json({ error: "Not found" });
    const comments = await D.Comment.find({ content: content._id }).sort({ isPinned: -1, createdAt: 1 }).populate("author", "name avatarUrl role").lean();
    const ids = comments.map((c) => c._id);
    const [counts, mine] = await Promise.all([
      D.CommentVote.aggregate([{ $match: { comment: { $in: ids } } }, { $group: { _id: "$comment", n: { $sum: 1 } } }]),
      req.user ? D.CommentVote.find({ comment: { $in: ids }, user: req.user._id }).select("comment").lean() : [],
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
    const mineSet = new Set(mine.map((m) => String(m.comment)));
    res.json(comments.map((c) => ({ ...c, author: maskAuthor(c.author), upvotes: countMap.get(String(c._id)) || 0, viewerUpvoted: mineSet.has(String(c._id)) })));
  });

  router.post("/:id/upvote", D.requireAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    const comment = await D.Comment.findById(req.params.id).select("author content");
    if (!comment) return res.status(404).json({ error: "Not found" });
    const content = await D.Content.findById(comment.content).select("status visibility uploader institutionDomain authorizedEmails");
    if (!content || !D.canViewContent(content, req.user, verified(req))) return res.status(404).json({ error: "Not found" });
    if (String(comment.author) === String(req.user._id)) return res.status(400).json({ error: "You can't upvote your own comment." });
    const existing = await D.CommentVote.findOne({ comment: comment._id, user: req.user._id });
    if (existing) await existing.deleteOne();
    else { try { await D.CommentVote.create({ comment: comment._id, user: req.user._id }); } catch (e) { if (e.code !== 11000) throw e; } }
    res.json({ upvoted: !existing, count: await D.CommentVote.countDocuments({ comment: comment._id }) });
  });

  return router;
}
export default createCommentsPlusRouter();

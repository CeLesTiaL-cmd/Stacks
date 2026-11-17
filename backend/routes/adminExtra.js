import express from "express";
import mongoose from "mongoose";
import Content from "../models/Content.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Star from "../models/Star.js";
import Feature from "../models/Feature.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

// Mounted BEFORE the original admin router so these stricter routes win.
// Auth is applied per route (not router.use) so requests are not verified twice.
const router = express.Router();
const staff = [requireAuth, requireRole("admin", "moderator")];
const adminOnly = [requireAuth, requireRole("admin")];

const ROLES = ["student", "researcher", "teacher", "organization", "university_admin", "moderator", "admin"];
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const paging = (q, def = 15) => {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(q.limit) || def));
  return { page, limit, skip: (page - 1) * limit };
};
function fillDays(rows, days = 14) {
  const map = new Map(rows.map((r) => [r._id, r.count]));
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    out.push({ date: d, count: map.get(d) || 0 });
  }
  return out;
}

router.get("/overview", staff, async (req, res) => {
  const since = new Date(Date.now() - 14 * 86400000);
  const daily = (Model) => Model.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]);
  const [users, byStatus, comments, stars, sums, byType, unis, upSeries, userSeries, broken, rUploads, rUsers, rComments] = await Promise.all([
    User.countDocuments(),
    Content.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Comment.countDocuments(),
    Star.countDocuments(),
    Content.aggregate([{ $group: { _id: null, views: { $sum: "$counts.views" }, downloads: { $sum: "$counts.downloads" } } }]),
    Content.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    Content.aggregate([{ $match: { status: "approved", university: { $ne: "" } } }, { $group: { _id: "$university", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 6 }]),
    daily(Content),
    daily(User),
    Content.countDocuments({ files: { $elemMatch: { url: { $not: /^http/ } } } }),
    Content.find().sort({ createdAt: -1 }).limit(6).select("title createdAt").lean(),
    User.find().sort({ createdAt: -1 }).limit(6).select("name createdAt").lean(),
    Comment.find().sort({ createdAt: -1 }).limit(6).populate("author", "name").populate("content", "title").lean(),
  ]);
  const status = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const recent = [
    ...rUploads.map((c) => ({ kind: "upload", id: c._id, text: c.title, at: c.createdAt })),
    ...rUsers.map((u) => ({ kind: "user", id: u._id, text: u.name, at: u.createdAt })),
    ...rComments.map((c) => ({ kind: "comment", id: c._id, text: `${c.author?.name || "?"}: ${String(c.body).slice(0, 80)}`, at: c.createdAt })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
  res.json({
    totals: { users, content: (status.pending || 0) + (status.approved || 0) + (status.rejected || 0), pending: status.pending || 0, approved: status.approved || 0, rejected: status.rejected || 0, comments, stars, views: sums[0]?.views || 0, downloads: sums[0]?.downloads || 0, broken },
    series: { uploads: fillDays(upSeries), users: fillDays(userSeries) },
    byType, topUniversities: unis, recent,
  });
});

router.get("/manage/content", staff, async (req, res) => {
  const { q, status, visibility } = req.query;
  const { page, limit, skip } = paging(req.query);
  const filter = {};
  if (["pending", "approved", "rejected"].includes(status)) filter.status = status;
  if (["public", "institutional", "protected"].includes(visibility)) filter.visibility = visibility;
  if (q) { const rx = new RegExp(esc(q), "i"); filter.$or = [{ title: rx }, { university: rx }, { category: rx }]; }
  const [items, total] = await Promise.all([
    Content.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-description -authorizedEmails").populate("uploader", "name email").lean(),
    Content.countDocuments(filter),
  ]);
  const featured = new Set((await Feature.find({ content: { $in: items.map((i) => i._id) } }).select("content").lean()).map((f) => String(f.content)));
  res.json({
    items: items.map((i) => ({ ...i, hasBrokenFiles: (i.files || []).some((f) => !String(f.url || "").startsWith("http")), isFeatured: featured.has(String(i._id)) })),
    total, page, pages: Math.ceil(total / limit),
  });
});

router.post("/features/:id", staff, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const content = await Content.findById(req.params.id).select("status visibility");
  if (!content) return res.status(404).json({ error: "Not found" });
  const existing = await Feature.findOne({ content: content._id });
  if (existing) { await existing.deleteOne(); return res.json({ featured: false }); }
  if (content.status !== "approved" || content.visibility !== "public") return res.status(400).json({ error: "Only approved public content can be featured." });
  await Feature.create({ content: content._id, addedBy: req.user._id });
  return res.json({ featured: true });
});

router.get("/users", staff, async (req, res) => {
  const { q, role } = req.query;
  const { page, limit, skip } = paging(req.query, 20);
  const filter = {};
  if (ROLES.includes(role)) filter.role = role;
  if (q) { const rx = new RegExp(esc(q), "i"); filter.$or = [{ name: rx }, { email: rx }]; }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("name email role avatarUrl isVerified isSuspended institution isInstitutionalVerified createdAt stats").lean(),
    User.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

async function targetUser(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: "Invalid id" }); return null; }
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404).json({ error: "User not found" }); return null; }
  return user;
}

router.patch("/users/:id/role", adminOnly, async (req, res) => {
  if (!ROLES.includes(req.body.role)) return res.status(400).json({ error: "Invalid role" });
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ error: "You can't change your own role." });
  const user = await targetUser(req, res); if (!user) return undefined;
  user.role = req.body.role; await user.save();
  return res.json(user);
});
router.patch("/users/:id/suspend", adminOnly, async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ error: "You can't suspend yourself." });
  const user = await targetUser(req, res); if (!user) return undefined;
  if (user.role === "admin") return res.status(403).json({ error: "Admins can't be suspended." });
  user.isSuspended = req.body.suspended !== false; await user.save();
  return res.json(user);
});
router.patch("/users/:id/verify", adminOnly, async (req, res) => {
  const user = await targetUser(req, res); if (!user) return undefined;
  user.isVerified = req.body.verified !== false; await user.save();
  return res.json(user);
});

router.get("/comments", staff, async (req, res) => {
  const { page, limit, skip } = paging(req.query, 20);
  const [items, total] = await Promise.all([
    Comment.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("author", "name avatarUrl").populate("content", "title slug").lean(),
    Comment.countDocuments(),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

export default router;

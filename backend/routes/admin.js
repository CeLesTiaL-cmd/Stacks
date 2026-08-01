import express from "express";
import Content from "../models/Content.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin", "moderator"));

// GET /api/admin/pending — approval queue
router.get("/pending", async (req, res) => {
  const items = await Content.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("uploader", "name email university");
  res.json(items);
});

// PATCH /api/admin/content/:id/approve
router.patch("/content/:id/approve", async (req, res) => {
  const content = await Content.findByIdAndUpdate(
    req.params.id,
    { status: "approved", rejectionReason: "" },
    { new: true }
  );
  if (!content) return res.status(404).json({ error: "Not found" });
  res.json(content);
});

// PATCH /api/admin/content/:id/reject
router.patch("/content/:id/reject", async (req, res) => {
  const { reason = "" } = req.body;
  const content = await Content.findByIdAndUpdate(
    req.params.id,
    { status: "rejected", rejectionReason: reason },
    { new: true }
  );
  if (!content) return res.status(404).json({ error: "Not found" });
  res.json(content);
});

// PATCH /api/admin/content/:id/feature — pin to homepage/leaderboards (V2 hook)
router.patch("/content/:id/feature", async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ error: "Not found" });
  content.isFeatured = !content.isFeatured;
  await content.save();
  res.json(content);
});

// DELETE /api/admin/content/:id
router.delete("/content/:id", async (req, res) => {
  await Content.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// PATCH /api/admin/users/:id/suspend
router.patch("/users/:id/suspend", requireRole("admin"), async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isSuspended: true },
    { new: true }
  );
  res.json(user);
});

// PATCH /api/admin/users/:id/verify
router.patch("/users/:id/verify", requireRole("admin"), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
  res.json(user);
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", requireRole("admin"), async (req, res) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  res.json(user);
});

// GET /api/admin/stats — quick platform overview
router.get("/stats", async (req, res) => {
  const [totalUsers, totalContent, pendingCount, approvedCount] = await Promise.all([
    User.countDocuments(),
    Content.countDocuments(),
    Content.countDocuments({ status: "pending" }),
    Content.countDocuments({ status: "approved" }),
  ]);
  res.json({ totalUsers, totalContent, pendingCount, approvedCount });
});

export default router;

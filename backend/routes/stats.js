import express from "express";
import Content from "../models/Content.js";
import Feature from "../models/Feature.js";

const router = express.Router();
const PUBLIC = { status: "approved", visibility: "public" };
let cache = { at: 0, data: null };

router.get("/", async (req, res) => {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  if (cache.data && Date.now() - cache.at < 5 * 60 * 1000) return res.json(cache.data);
  const [uploads, authors, universities, dl] = await Promise.all([
    Content.countDocuments(PUBLIC),
    Content.distinct("uploader", PUBLIC).then((a) => a.length),
    Content.distinct("university", { ...PUBLIC, university: { $ne: "" } }).then((a) => a.length),
    Content.aggregate([{ $match: PUBLIC }, { $group: { _id: null, downloads: { $sum: "$counts.downloads" } } }]),
  ]);
  cache = { at: Date.now(), data: { uploads, authors, universities, downloads: dl[0]?.downloads || 0 } };
  return res.json(cache.data);
});

router.get("/featured", async (req, res) => {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  const features = await Feature.find().sort({ createdAt: -1 }).limit(12).select("content").lean();
  const ids = features.map((f) => f.content);
  const items = await Content.find({ _id: { $in: ids }, ...PUBLIC })
    .select("-authorizedEmails -institutionDomain -description")
    .populate("uploader", "name avatarUrl university")
    .lean();
  const byId = new Map(items.map((i) => [String(i._id), i]));
  res.json(ids.map((id) => byId.get(String(id))).filter(Boolean).slice(0, 6));
});

export default router;

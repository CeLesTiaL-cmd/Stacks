import express from "express";
import slugify from "slugify";
import Content from "../models/Content.js";
import Star from "../models/Star.js";
import Bookmark from "../models/Bookmark.js";
import User from "../models/User.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

const MULTI_VALUE_FIELDS = ["tags", "keywords", "coAuthors", "externalLinks"];

function toArray(value) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function makeUniqueSlug(title) {
  const base = slugify(title, { lower: true, strict: true }).slice(0, 80);
  let slug = base || `upload-${Date.now()}`;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Content.exists({ slug })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

/**
 * GET /api/content
 * Google-like discover/search endpoint with filters.
 * Query params: q, category, subcategory, type, country, university,
 * department, course, teacher, semester, year, language, license, tag,
 * sort=recent|downloads|stars|views, page, limit
 */
router.get("/", async (req, res) => {
  const {
    q,
    category,
    subcategory,
    type,
    country,
    university,
    department,
    course,
    teacher,
    semester,
    year,
    language,
    license,
    tag,
    sort = "recent",
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { status: "approved", visibility: "public" };

  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (type) filter.type = type;
  if (country) filter.country = country;
  if (university) filter.university = university;
  if (department) filter.department = department;
  if (course) filter.course = course;
  if (teacher) filter.teacher = teacher;
  if (semester) filter.semester = semester;
  if (year) filter.year = Number(year);
  if (language) filter.language = language;
  if (license) filter.license = license;
  if (tag) filter.tags = tag.toLowerCase();
  if (q) filter.$text = { $search: q };

  const sortMap = {
    recent: { createdAt: -1 },
    downloads: { "counts.downloads": -1 },
    stars: { "counts.stars": -1 },
    views: { "counts.views": -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Content.find(filter)
      .sort(sortMap[sort] || sortMap.recent)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("uploader", "name avatarUrl university"),
    Content.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

// GET /api/content/filters — distinct values to populate filter dropdowns
router.get("/filters", async (req, res) => {
  const base = { status: "approved", visibility: "public" };
  const [countries, universities, departments, categories, languages, years] = await Promise.all([
    Content.distinct("country", base),
    Content.distinct("university", base),
    Content.distinct("department", base),
    Content.distinct("category", base),
    Content.distinct("language", base),
    Content.distinct("year", base),
  ]);
  res.json({
    countries: countries.filter(Boolean).sort(),
    universities: universities.filter(Boolean).sort(),
    departments: departments.filter(Boolean).sort(),
    categories: categories.filter(Boolean).sort(),
    languages: languages.filter(Boolean).sort(),
    years: years.filter(Boolean).sort((a, b) => b - a),
  });
});

// POST /api/content — create a new upload (goes to "pending" for admin approval)
router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "files", maxCount: 10 },
    { name: "thumbnail", maxCount: 1 },
    { name: "previewImages", maxCount: 6 },
  ]),
  async (req, res) => {
    try {
      const body = { ...req.body };
      for (const field of MULTI_VALUE_FIELDS) {
        body[field] = toArray(body[field]);
      }

      if (!body.title || !body.type || !body.category) {
        return res.status(400).json({ error: "title, type and category are required" });
      }

      const slug = await makeUniqueSlug(body.title);

      const files = (req.files?.files || []).map((f) => ({
        url: f.path,
        originalName: f.originalname,
        mimeType: f.mimetype,
        sizeBytes: f.size,
      }));

      const thumbnailUrl = req.files?.thumbnail?.[0]?.path || "";

      const previewImageUrls = (req.files?.previewImages || []).map((f) => f.path);

      const content = await Content.create({
        ...body,
        slug,
        year: body.year ? Number(body.year) : undefined,
        uploader: req.user._id,
        files,
        thumbnailUrl,
        previewImageUrls,
        status: "pending",
      });

      await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.uploadsCount": 1 } });

      res.status(201).json(content);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not create upload" });
    }
  }
);

// GET /api/content/:slug — full detail page, increments view count
router.get("/:slug", optionalAuth, async (req, res) => {
  const content = await Content.findOne({ slug: req.params.slug }).populate(
    "uploader",
    "name avatarUrl university department"
  );

  if (!content) return res.status(404).json({ error: "Not found" });

  const isOwner = req.user && String(req.user._id) === String(content.uploader._id);
  const isStaff = req.user && ["admin", "moderator"].includes(req.user.role);

  if (content.status !== "approved" && !isOwner && !isStaff) {
    return res.status(404).json({ error: "Not found" });
  }

  if (!isOwner) {
    content.counts.views += 1;
    await content.save();
  }

  let viewerHasStarred = false;
  let viewerHasBookmarked = false;
  if (req.user) {
    const [star, bookmark] = await Promise.all([
      Star.exists({ user: req.user._id, content: content._id }),
      Bookmark.exists({ user: req.user._id, content: content._id }),
    ]);
    viewerHasStarred = Boolean(star);
    viewerHasBookmarked = Boolean(bookmark);
  }

  res.json({ content, viewerHasStarred, viewerHasBookmarked });
});

// PATCH /api/content/:id — owner edits metadata
router.patch("/:id", requireAuth, async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ error: "Not found" });
  if (String(content.uploader) !== String(req.user._id) && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not your upload" });
  }

  const editable = [
    "title",
    "subtitle",
    "abstract",
    "description",
    "category",
    "subcategory",
    "tags",
    "keywords",
    "language",
    "country",
    "university",
    "department",
    "course",
    "teacher",
    "semester",
    "year",
    "coAuthors",
    "license",
    "visibility",
    "externalLinks",
    "githubRepo",
    "youtubeUrl",
    "doi",
    "publication",
  ];

  for (const key of editable) {
    if (req.body[key] !== undefined) {
      content[key] = MULTI_VALUE_FIELDS.includes(key) ? toArray(req.body[key]) : req.body[key];
    }
  }

  await content.save();
  res.json(content);
});

// DELETE /api/content/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ error: "Not found" });
  if (String(content.uploader) !== String(req.user._id) && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not your upload" });
  }
  await content.deleteOne();
  res.json({ ok: true });
});

// POST /api/content/:id/download/:fileIndex — tracks a download, returns the file URL
router.post("/:id/download/:fileIndex", optionalAuth, async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content || content.status !== "approved") {
    return res.status(404).json({ error: "Not found" });
  }
  const file = content.files[Number(req.params.fileIndex)];
  if (!file) return res.status(404).json({ error: "File not found" });

  content.counts.downloads += 1;
  await content.save();
  await User.findByIdAndUpdate(content.uploader, { $inc: { "stats.downloadsReceived": 1 } });

  res.json({ url: file.url, originalName: file.originalName });
});

// POST /api/content/:id/star — toggle star
router.post("/:id/star", requireAuth, async (req, res) => {
  const existing = await Star.findOne({ user: req.user._id, content: req.params.id });
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ error: "Not found" });

  if (existing) {
    await existing.deleteOne();
    content.counts.stars = Math.max(0, content.counts.stars - 1);
    await User.findByIdAndUpdate(content.uploader, { $inc: { "stats.starsReceived": -1 } });
  } else {
    await Star.create({ user: req.user._id, content: content._id });
    content.counts.stars += 1;
    await User.findByIdAndUpdate(content.uploader, { $inc: { "stats.starsReceived": 1 } });
  }
  await content.save();
  res.json({ starred: !existing, starCount: content.counts.stars });
});

// POST /api/content/:id/bookmark — toggle bookmark
router.post("/:id/bookmark", requireAuth, async (req, res) => {
  const existing = await Bookmark.findOne({ user: req.user._id, content: req.params.id });
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ error: "Not found" });

  if (existing) {
    await existing.deleteOne();
    content.counts.bookmarks = Math.max(0, content.counts.bookmarks - 1);
  } else {
    await Bookmark.create({ user: req.user._id, content: content._id });
    content.counts.bookmarks += 1;
  }
  await content.save();
  res.json({ bookmarked: !existing, bookmarkCount: content.counts.bookmarks });
});

export default router;

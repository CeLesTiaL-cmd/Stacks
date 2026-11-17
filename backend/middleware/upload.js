import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import path from "path";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BLOCKED = new Set([".exe", ".msi", ".scr", ".com", ".bat", ".cmd", ".vbs", ".dll"]);
const maxSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 50);

/** Browsers send UTF-8 names that multer may decode as latin1 (Bangla names turn to mojibake). */
export function fixFilename(name = "") {
  if (/[^\u0000-\u00ff]/.test(name)) return name; // already proper Unicode
  const decoded = Buffer.from(name, "latin1").toString("utf8");
  return decoded.includes("\uFFFD") ? name : decoded;
}

export function folderFor(fieldname) {
  if (fieldname === "thumbnail") return "academic-repo/thumbnails";
  if (fieldname === "previewImages") return "academic-repo/previews";
  if (fieldname === "avatar" || fieldname === "cover") return "academic-repo/avatars";
  return "academic-repo/files";
}

export function resourceTypeFor(file) {
  if (file.fieldname !== "files") return "image"; // thumbnails, previews, avatars
  if (file.mimetype?.startsWith("image/")) return "image";
  if (file.mimetype?.startsWith("video/")) return "video";
  return "raw"; // pdf, pptx, docx, zip …
}

/**
 * THE .pptx BUG: the old code used `originalname.split(".")[0]`, which dropped the extension.
 * Cloudinary serves "raw" files exactly as named, so the download had no extension.
 * For raw files the extension must be part of the public_id.
 */
export function publicIdFor(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const base =
    path
      .basename(file.originalname || "file", ext)
      .replace(/[^A-Za-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "file";
  const unique = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  return resourceTypeFor(file) === "raw" ? `${unique}-${base}${ext}` : `${unique}-${base}`;
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: folderFor(file.fieldname),
    resource_type: resourceTypeFor(file),
    public_id: publicIdFor(file),
    use_filename: false,
    unique_filename: false,
  }),
});

function fileFilter(req, file, cb) {
  file.originalname = fixFilename(file.originalname); // decode once, here
  const ext = path.extname(file.originalname).toLowerCase();
  if (BLOCKED.has(ext)) return cb(Object.assign(new Error(`Files of type ${ext} are not allowed.`), { status: 400 }));
  return cb(null, true);
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: maxSizeMb * 1024 * 1024 } });

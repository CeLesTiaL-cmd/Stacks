import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOAD_ROOT = path.resolve("uploads");

for (const sub of ["files", "thumbnails", "previews", "avatars"]) {
  fs.mkdirSync(path.join(UPLOAD_ROOT, sub), { recursive: true });
}

function destinationFor(fieldname) {
  if (fieldname === "thumbnail") return path.join(UPLOAD_ROOT, "thumbnails");
  if (fieldname === "previewImages") return path.join(UPLOAD_ROOT, "previews");
  if (fieldname === "avatar" || fieldname === "cover") return path.join(UPLOAD_ROOT, "avatars");
  return path.join(UPLOAD_ROOT, "files");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, destinationFor(file.fieldname)),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

const maxSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 50);

export const upload = multer({
  storage,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

/**
 * NOTE FOR PRODUCTION: local disk storage works for V1 and small deployments,
 * but most hosting platforms (Render, Railway, Vercel) use ephemeral
 * filesystems — uploaded files can be wiped on every redeploy/restart.
 * Before scaling past a single demo deployment, swap this storage engine
 * for a cloud object store (Cloudinary, AWS S3, or Firebase Storage) — the
 * route handlers only care about the resulting public `url`, so the swap is
 * isolated to this file.
 */

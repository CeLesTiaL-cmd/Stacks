// One-off: give OLD uploaded files (pptx/docx/xlsx/zip…) their missing extension so previews work.
//   node scripts/fix-file-extensions.js --dry     (just list what would change)
//   node scripts/fix-file-extensions.js           (do it)
import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Content from "../models/Content.js";
import { rawPublicIdFromUrl } from "../services/cloudinaryUrl.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
const dry = process.argv.includes("--dry");
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

await mongoose.connect(process.env.MONGODB_URI);
const items = await Content.find({ "files.url": /\/raw\/upload\// }).select("title files");
let fixed = 0, already = 0, failed = 0;

for (const c of items) {
  const files = c.files.map((f) => (f.toObject ? f.toObject() : { ...f }));
  let changed = false;
  for (const f of files) {
    const info = rawPublicIdFromUrl(f.url, f.originalName);
    if (!info || info.hasExt) { already += info ? 1 : 0; continue; }
    if (dry) { console.log(`would fix: ${info.publicId}  ->  ${info.newPublicId}`); continue; }
    try {
      const r = await cloudinary.uploader.rename(info.publicId, info.newPublicId, { resource_type: "raw", overwrite: false, invalidate: true });
      f.url = r.secure_url; changed = true; fixed += 1;
      console.log(`fixed: ${info.newPublicId}`);
    } catch (e) { failed += 1; console.warn(`FAILED ${info.publicId}:`, e?.error?.message || e.message); }
  }
  if (changed) await Content.updateOne({ _id: c._id }, { $set: { files } });
}
console.log(`\nDone. fixed=${fixed} alreadyOK=${already} failed=${failed}${dry ? " (dry run, nothing changed)" : ""}`);
await mongoose.disconnect();

import path from "path";

/**
 * Old uploads (before patch 1) were stored as Cloudinary "raw" files WITHOUT the file extension in their public_id,
 * so their links end like ".../1793-Crop_Disease_Model" instead of ".../1793-Crop_Disease_Model.pptx".
 * Microsoft's viewer (and browsers) need the extension. This works out the corrected public_id.
 */
export function rawPublicIdFromUrl(url, originalName) {
  const m = String(url).match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\/raw\/upload\/(?:v\d+\/)?(.+)$/);
  const ext = path.extname(String(originalName || "")).toLowerCase();
  if (!m || !ext) return null;
  const publicId = decodeURIComponent(m[2]);
  const hasExt = publicId.toLowerCase().endsWith(ext);
  return { cloud: m[1], publicId, hasExt, newPublicId: hasExt ? publicId : publicId + ext };
}

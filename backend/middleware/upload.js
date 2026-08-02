import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function folderFor(fieldname) {
  if (fieldname === "thumbnail") return "academic-repo/thumbnails";
  if (fieldname === "previewImages") return "academic-repo/previews";
  if (fieldname === "avatar" || fieldname === "cover") return "academic-repo/avatars";
  return "academic-repo/files";
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: folderFor(file.fieldname),
    resource_type: "auto", // allows pdf, docx, images, zip, etc.
    public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
  }),
});

const maxSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 50);

export const upload = multer({
  storage,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});
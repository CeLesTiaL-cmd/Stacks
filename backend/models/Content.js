import mongoose from "mongoose";

const { Schema } = mongoose;

const FileSchema = new Schema(
  {
    url: String,
    originalName: String,
    mimeType: String,
    sizeBytes: Number,
  },
  { _id: false }
);

const ContentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true },
    subtitle: { type: String, default: "", maxlength: 250 },
    abstract: { type: String, default: "", maxlength: 1000 },
    description: { type: String, default: "" },

    type: {
      type: String,
      required: true,
      enum: [
        "research",
        "thesis",
        "project",
        "assignment",
        "notes",
        "ppt",
        "book",
        "lab_report",
        "dataset",
        "source_code",
        "presentation",
        "question_paper",
        "solution",
        "poster",
        "course_material",
        "other",
      ],
    },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: "" },
    tags: [{ type: String, lowercase: true, trim: true, index: true }],
    keywords: [{ type: String }],
    language: { type: String, default: "English" },

    // Academic context
    country: { type: String, default: "", index: true },
    university: { type: String, default: "", index: true },
    department: { type: String, default: "", index: true },
    course: { type: String, default: "" },
    teacher: { type: String, default: "" },
    semester: { type: String, default: "" },
    year: { type: Number },

    // Authorship
    uploader: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isAnonymousUpload: { type: Boolean, default: false },
    coAuthors: [{ type: String }],

    license: {
      type: String,
      enum: ["all_rights_reserved", "cc_by", "cc_by_sa", "cc_by_nc", "cc0", "custom"],
      default: "all_rights_reserved",
    },

    // --- Visibility (3-tier model) ---
    // public         -> anyone, including other institutions
    // institutional  -> only users institutionally verified with the SAME institutionDomain
    // protected      -> only the uploader + emails listed in authorizedEmails (advisor/team)
    visibility: {
      type: String,
      enum: ["public", "institutional", "protected"],
      default: "public",
    },
    // Auto-filled server-side from the uploader's verified institution at upload time.
    // Only meaningful when visibility === "institutional".
    institutionDomain: { type: String, default: "" },
    // Only meaningful when visibility === "protected" — advisor/team member emails.
    authorizedEmails: [{ type: String, lowercase: true, trim: true }],

    thumbnailUrl: { type: String, default: "" },
    previewImageUrls: [{ type: String }],
    files: [FileSchema],

    externalLinks: [{ type: String }],
    githubRepo: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    doi: { type: String, default: "" },
    publication: { type: String, default: "" },

    // Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },

    // Denormalized counters for fast sorting/leaderboards
    counts: {
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      stars: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Full text search across the fields users actually search by
ContentSchema.index({
  title: "text",
  subtitle: "text",
  abstract: "text",
  description: "text",
  tags: "text",
  keywords: "text",
  university: "text",
  department: "text",
  course: "text",
  teacher: "text",
});

// Common filter/sort combinations
ContentSchema.index({ status: 1, createdAt: -1 });
ContentSchema.index({ status: 1, "counts.downloads": -1 });
ContentSchema.index({ status: 1, "counts.stars": -1 });
ContentSchema.index({ category: 1, status: 1 });
ContentSchema.index({ status: 1, visibility: 1, institutionDomain: 1 });

export default mongoose.model("Content", ContentSchema);
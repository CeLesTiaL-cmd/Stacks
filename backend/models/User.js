import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 500 },

    role: {
      type: String,
      enum: [
        "student",
        "researcher",
        "teacher",
        "organization",
        "university_admin",
        "moderator",
        "admin",
      ],
      default: "student",
    },

    // Academic context
    country: { type: String, default: "" },
    university: { type: String, default: "" },
    department: { type: String, default: "" },
    degree: { type: String, default: "" },
    semester: { type: String, default: "" },
    researchInterests: [{ type: String }],
    skills: [{ type: String }],

    // --- Institutional verification (for the "Institutional" visibility tier) ---
    institutionalEmail: { type: String, default: "", lowercase: true, trim: true },
    institutionDomain: { type: String, default: "" }, // e.g. "iiuc.edu.bd" — used for matching content
    institution: { type: String, default: "" }, // human-readable name, e.g. "IIUC"
    isInstitutionalVerified: { type: Boolean, default: false },

    // Links
    website: { type: String, default: "" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },

    // Privacy
    privacy: {
      profileVisibility: {
        type: String,
        enum: ["public", "private", "followers", "university"],
        default: "public",
      },
      hideUploadHistory: { type: Boolean, default: false },
      hideStatistics: { type: Boolean, default: false },
      hideFollowers: { type: Boolean, default: false },
    },

    // Denormalized stats (kept in sync via hooks/services as the app grows)
    stats: {
      uploadsCount: { type: Number, default: 0 },
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      starsReceived: { type: Number, default: 0 },
      downloadsReceived: { type: Number, default: 0 },
      viewsReceived: { type: Number, default: 0 },
    },

    isVerified: { type: Boolean, default: false }, // verified university/teacher badge
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ name: "text", university: "text", department: "text" });

export default mongoose.model("User", UserSchema);
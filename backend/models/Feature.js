import mongoose from "mongoose";
const { Schema } = mongoose;

// Admin-curated "featured" list, kept separate so the Content schema stays untouched.
const FeatureSchema = new Schema(
  {
    content: { type: Schema.Types.ObjectId, ref: "Content", required: true, unique: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
export default mongoose.model("Feature", FeatureSchema);

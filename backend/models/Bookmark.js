import mongoose from "mongoose";

const { Schema } = mongoose;

const BookmarkSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: Schema.Types.ObjectId, ref: "Content", required: true },
  },
  { timestamps: true }
);

BookmarkSchema.index({ user: 1, content: 1 }, { unique: true });

export default mongoose.model("Bookmark", BookmarkSchema);

import mongoose from "mongoose";

const { Schema } = mongoose;

const StarSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: Schema.Types.ObjectId, ref: "Content", required: true },
  },
  { timestamps: true }
);

StarSchema.index({ user: 1, content: 1 }, { unique: true });

export default mongoose.model("Star", StarSchema);

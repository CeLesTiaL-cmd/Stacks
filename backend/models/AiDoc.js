import mongoose from "mongoose";
const { Schema } = mongoose;

// One searchable index per uploaded work: text chunks + their embeddings + a cached summary.
const AiDocSchema = new Schema(
  {
    content: { type: Schema.Types.ObjectId, ref: "Content", required: true, unique: true },
    fingerprint: { type: String, default: "" },
    chunks: [{ _id: false, fileIndex: Number, fileName: String, text: String, embedding: [Number] }],
    embedded: { type: Boolean, default: false },
    indexedAt: { type: Date },
    summary: { type: String, default: "" },
    summaryAt: { type: Date },
  },
  { timestamps: true }
);
export default mongoose.model("AiDoc", AiDocSchema);

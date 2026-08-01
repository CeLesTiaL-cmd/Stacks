import mongoose from "mongoose";

const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    content: { type: Schema.Types.ObjectId, ref: "Content", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    body: { type: String, required: true, maxlength: 2000 },
    isPinned: { type: Boolean, default: false },
    isAuthorReply: { type: Boolean, default: false }, // reply from the content's uploader
    isModeratorReply: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommentSchema.index({ content: 1, createdAt: -1 });

export default mongoose.model("Comment", CommentSchema);

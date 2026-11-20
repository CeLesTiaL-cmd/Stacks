import mongoose from "mongoose";
const { Schema } = mongoose;

// "I agree" upvote on a comment — one per user per comment.
const CommentVoteSchema = new Schema(
  { comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true, index: true }, user: { type: Schema.Types.ObjectId, ref: "User", required: true } },
  { timestamps: true }
);
CommentVoteSchema.index({ comment: 1, user: 1 }, { unique: true });
export default mongoose.model("CommentVote", CommentVoteSchema);

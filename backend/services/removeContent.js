import Bookmark from "../models/Bookmark.js";
import Comment from "../models/Comment.js";
import Star from "../models/Star.js";
import User from "../models/User.js";

export async function removeContentAndRelations(content) {
  const starCount = await Star.countDocuments({ content: content._id });
  await Promise.all([
    Comment.deleteMany({ content: content._id }),
    Star.deleteMany({ content: content._id }),
    Bookmark.deleteMany({ content: content._id }),
    content.deleteOne(),
    User.findByIdAndUpdate(content.uploader, {
      $inc: {
        "stats.uploadsCount": -1,
        "stats.starsReceived": -starCount,
        "stats.downloadsReceived": -(content.counts?.downloads || 0),
      },
    }),
  ]);
}

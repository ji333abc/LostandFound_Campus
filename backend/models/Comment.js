const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true }
  },
  { timestamps: true }
);

commentSchema.index({ item: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);


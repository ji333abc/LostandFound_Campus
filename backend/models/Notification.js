const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'match_found' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    sourceItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    matchedItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    matchScore: { type: Number, default: 0 },
    matchLevel: { type: String, default: 'low' },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ sourceItem: 1, matchedItem: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);

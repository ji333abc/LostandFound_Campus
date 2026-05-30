const mongoose = require('mongoose');

const matchCacheSchema = new mongoose.Schema(
  {
    sourceItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    candidateItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    ruleScore: { type: Number, default: 0 },
    aiScore: { type: Number, default: 0 },
    matched: { type: Boolean, default: false },
    confidence: { type: String, default: 'low' },
    reason: { type: String, default: '' },
    sourceUpdatedAt: { type: Date, required: true },
    candidateUpdatedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

matchCacheSchema.index(
  { sourceItem: 1, candidateItem: 1, provider: 1, model: 1 },
  { unique: true }
);
matchCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('MatchCache', matchCacheSchema);

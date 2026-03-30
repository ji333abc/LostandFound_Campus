const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['lost', 'found'], required: true }, // lost: 寻物, found: 招领
    category: { type: String },
    description: { type: String },
    location: { type: String },
    time: { type: Date },
    images: [{ type: String }],
    contact: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' }
  },
  { timestamps: true }
);

itemSchema.index({ type: 1, status: 1, createdAt: -1 });
itemSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema);


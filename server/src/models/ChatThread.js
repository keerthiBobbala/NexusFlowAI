const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const ChatThreadSchema = new mongoose.Schema(
  {
    id: { type: String, default: randomUUID, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    title: { type: String, default: 'Workspace Chat' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.ChatThread || mongoose.model('ChatThread', ChatThreadSchema);

const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const ChatMessageSchema = new mongoose.Schema(
  {
    id: { type: String, default: randomUUID, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    threadId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    citations: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

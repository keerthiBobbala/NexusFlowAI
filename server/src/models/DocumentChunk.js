const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const DocumentChunkSchema = new mongoose.Schema(
  {
    id: { type: String, default: randomUUID, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    documentId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    tokenCountApprox: { type: Number, default: 0 },
    embedding: { type: [Number], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.models.DocumentChunk || mongoose.model('DocumentChunk', DocumentChunkSchema);

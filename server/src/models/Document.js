const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const DocumentSchema = new mongoose.Schema(
  {
    id: { type: String, default: randomUUID, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, required: true },
    fileType: { type: String, required: true },
    status: { type: String, default: 'uploaded' },
    extractedText: { type: String, default: '' },
    summary: { type: String, default: '' },
    pageCount: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    processingError: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

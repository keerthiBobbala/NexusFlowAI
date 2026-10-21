const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

// TODO: Define the fields: id, userId, name, description, color.
// TODO: Keep `id` as an indexed, unique randomUUID default.
const WorkspaceSchema = new mongoose.Schema(
  {
    id: { type: String, default: randomUUID, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#0f766e' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);

const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const WorkflowRunSchema = new mongoose.Schema(
  {
    id: { type: String, default: randomUUID, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    status: { type: String, default: 'queued' },
    title: { type: String, default: '' },
    input: { type: mongoose.Schema.Types.Mixed, default: {} },
    output: { type: mongoose.Schema.Types.Mixed, default: {} },
    citations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    evaluation: { type: mongoose.Schema.Types.Mixed, default: {} },
    trace: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.models.WorkflowRun || mongoose.model('WorkflowRun', WorkflowRunSchema);

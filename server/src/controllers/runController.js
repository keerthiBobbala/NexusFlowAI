const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const repository = require('../services/repository');
const { runWorkflow } = require('../services/pipelineService');

async function getOwnedWorkspace(workspaceId, userId) {
  const workspace = await repository.getById('workspaces', workspaceId);
  if (!workspace || workspace.userId !== userId) throw httpError(404, 'Workspace not found');
  return workspace;
}

async function getOwnedRun(runId, userId) {
  const run = await repository.getById('workflowRuns', runId);
  if (!run || run.userId !== userId) throw httpError(404, 'Run not found');
  return run;
}

async function ensureDocsBelongToWorkspace(documentIds, workspaceId, userId) {
  if (!Array.isArray(documentIds)) throw httpError(400, 'Document IDs must be a list');
  if (!documentIds.length) return [];
  const documents = await repository.getAll('documents', {
    id: { $in: documentIds },
    workspaceId,
    userId,
    status: 'ready'
  });
  if (documents.length !== new Set(documentIds).size) {
    throw httpError(400, 'Select processed documents from this workspace');
  }
  return documents;
}

const listWorkspaceRuns = asyncHandler(async (req, res) => {
  const workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id);
  const runs = await repository.getAll(
    'workflowRuns',
    { userId: req.user.id, workspaceId: workspace.id },
    { createdAt: -1 }
  );
  res.json({ runs });
});

const getRunById = asyncHandler(async (req, res) => {
  const run = await getOwnedRun(req.params.id, req.user.id);
  res.json({ run });
});

const summarizeWorkspace = asyncHandler(async (req, res) => {
  const workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id);
  const selectedDocumentIds = Array.isArray(req.body.documentIds) ? req.body.documentIds : [];
  await ensureDocsBelongToWorkspace(selectedDocumentIds, workspace.id, req.user.id);
  const run = await runWorkflow({
    userId: req.user.id,
    workspaceId: workspace.id,
    type: 'summarize',
    title: 'Workspace summary',
    input: { prompt: typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '' },
    selectedDocumentIds
  });
  res.status(201).json({ run, output: run.output });
});

const compareDocuments = asyncHandler(async (req, res) => {
  const workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id);
  const documentIds = Array.isArray(req.body.documentIds) ? req.body.documentIds : [];
  if (new Set(documentIds).size < 2) throw httpError(400, 'Select at least two processed documents to compare');
  const documents = await ensureDocsBelongToWorkspace(documentIds, workspace.id, req.user.id);
  const run = await runWorkflow({
    userId: req.user.id,
    workspaceId: workspace.id,
    type: 'compare',
    title: 'Document comparison',
    input: { prompt: typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '' },
    selectedDocumentIds: documents.map((document) => document.id)
  });
  res.status(201).json({ run, output: run.output });
});

const meetingActionItems = asyncHandler(async (req, res) => {
  const workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id);
  const selectedDocumentIds = Array.isArray(req.body.documentIds) ? req.body.documentIds : [];
  await ensureDocsBelongToWorkspace(selectedDocumentIds, workspace.id, req.user.id);
  const run = await runWorkflow({
    userId: req.user.id,
    workspaceId: workspace.id,
    type: 'meeting_action_items',
    title: 'Meeting action items',
    input: { prompt: typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '' },
    selectedDocumentIds
  });
  res.status(201).json({ run, output: run.output });
});

const researchBrief = asyncHandler(async (req, res) => {
  const workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id);
  const selectedDocumentIds = Array.isArray(req.body.documentIds) ? req.body.documentIds : [];
  await ensureDocsBelongToWorkspace(selectedDocumentIds, workspace.id, req.user.id);
  const run = await runWorkflow({
    userId: req.user.id,
    workspaceId: workspace.id,
    type: 'research_brief',
    title: 'Research brief',
    input: {
      prompt: typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '',
      topic: typeof req.body.topic === 'string' ? req.body.topic.trim() : ''
    },
    selectedDocumentIds
  });
  res.status(201).json({ run, output: run.output });
});

module.exports = {
  listWorkspaceRuns,
  getRunById,
  summarizeWorkspace,
  compareDocuments,
  meetingActionItems,
  researchBrief
};

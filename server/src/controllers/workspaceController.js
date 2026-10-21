const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const repository = require('../services/repository');
const { safeDeleteDir } = require('../utils/file');

async function getWorkspaceOrFail(workspaceId, userId) {
  const workspace = await repository.getById('workspaces', workspaceId);
  if (!workspace || workspace.userId !== userId) {
    throw httpError(404, 'Workspace not found');
  }
  return workspace;
}

const listWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await repository.getAll('workspaces', { userId: req.user.id }, { createdAt: -1 });
  res.json({ workspaces });
});

const { ensureDir, getWorkspaceUploadDir } = require('../utils/file');
const createWorkspace = asyncHandler(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    throw httpError(400, 'Workspace name is required');
  }
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const color = typeof req.body.color === 'string' ? req.body.color : '#0f766e';
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw httpError(400, 'Workspace color must be a valid hex color');
  }
  const userId = req.user.id;
  const workspaceData = { userId, name, description, color };
  const workspace = await repository.create('workspaces', workspaceData);

  const uploadDir = getWorkspaceUploadDir({ userId, workspaceId: workspace.id });
  await ensureDir(uploadDir);

  res.status(201).json({ workspace });
});

const getWorkspaceById = asyncHandler(async (req, res) => {
  const workspace = await getWorkspaceOrFail(req.params.id, req.user.id);
  const filter = { userId: req.user.id, workspaceId: workspace.id };
  const [documentCount, readyDocumentCount, runCount, recentDocuments, recentRuns] = await Promise.all([
    repository.count('documents', filter),
    repository.count('documents', { ...filter, status: 'ready' }),
    repository.count('workflowRuns', filter),
    repository.getAll('documents', filter, { createdAt: -1 }),
    repository.getAll('workflowRuns', filter, { createdAt: -1 })
  ]);
  res.json({
    workspace,
    workspaceStats: { documentCount, readyDocumentCount, runCount },
    recentDocuments: recentDocuments.slice(0, 5),
    recentRuns: recentRuns.slice(0, 5)
  });
});

const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await getWorkspaceOrFail(req.params.id, req.user.id);
  const updates = {};
  if (req.body.name !== undefined) {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) throw httpError(400, 'Workspace name is required');
    updates.name = name;
  }
  if (req.body.description !== undefined) {
    updates.description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  }
  if (req.body.color !== undefined) {
    if (typeof req.body.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(req.body.color)) {
      throw httpError(400, 'Workspace color must be a valid hex color');
    }
    updates.color = req.body.color;
  }
  const updatedWorkspace = await repository.updateById('workspaces', workspace.id, updates);
  res.json({ workspace: updatedWorkspace });
});

const deleteWorkspace = asyncHandler(async (req, res) => {
  const workspace = await getWorkspaceOrFail(req.params.id, req.user.id);
  const filter = { userId: req.user.id, workspaceId: workspace.id };
  const removed = await Promise.all([
    repository.deleteWhere('documentChunks', filter),
    repository.deleteWhere('chatMessages', filter),
    repository.deleteWhere('chatThreads', filter),
    repository.deleteWhere('workflowRuns', filter),
    repository.deleteWhere('documents', filter)
  ]);
  await repository.deleteById('workspaces', workspace.id);
  await safeDeleteDir(getWorkspaceUploadDir({ userId: req.user.id, workspaceId: workspace.id }));
  res.json({ deleted: true, removedCount: removed.reduce((total, records) => total + records.length, 0) });
});

module.exports = {
  listWorkspaces,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceOrFail
};

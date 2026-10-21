const asyncHandler = require('../utils/asyncHandler');
const repository = require('../services/repository');

const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [workspaces, documents, runs] = await Promise.all([
    repository.getAll('workspaces', { userId }, { updatedAt: -1 }),
    repository.getAll('documents', { userId }, { createdAt: -1 }),
    repository.getAll('workflowRuns', { userId }, { createdAt: -1 })
  ]);
  const fileTypeBreakdown = documents.reduce((breakdown, document) => {
    const type = document.fileType || 'unknown';
    breakdown[type] = (breakdown[type] || 0) + 1;
    return breakdown;
  }, {});

  res.json({
    workspaceCount: workspaces.length,
    documentCount: documents.length,
    runCount: runs.length,
    recentWorkspaces: workspaces.slice(0, 5),
    recentRuns: runs.slice(0, 8),
    fileTypeBreakdown
  });
});

module.exports = {
  getDashboard
};

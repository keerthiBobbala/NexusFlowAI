const { retrieveChunks } = require('../services/retrievalService');

async function retrieverAgent(context) {
  const chunks = await retrieveChunks({
    workspaceId: context.workspaceId,
    userId: context.userId,
    query: context.query,
    selectedDocumentIds: context.selectedDocumentIds,
    type: context.type
  });
  return { chunks };
}

module.exports = retrieverAgent;

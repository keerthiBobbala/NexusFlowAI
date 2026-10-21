export const queryKeys = {
  authUser: ['auth', 'me'],
  dashboard: ['dashboard'],
  workspaces: ['workspaces'],
  workspaceDetails: (workspaceId) => ['workspaces', workspaceId],
  workspaceDocuments: (workspaceId) => ['workspaces', workspaceId, 'documents'],
  workspaceChat: (workspaceId) => ['workspaces', workspaceId, 'chat'],
  workspaceChatMessages: (workspaceId, threadId) => ['workspaces', workspaceId, 'chat', threadId, 'messages'],
  workspaceRuns: (workspaceId) => ['workspaces', workspaceId, 'runs'],
  run: (runId) => ['runs', runId]
};

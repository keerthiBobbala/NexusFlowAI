import http from './http';

export const chatApi = {
  threads: async (workspaceId) => (await http.get(`/workspaces/${workspaceId}/chat`)).data,
  messages: async (workspaceId, threadId) =>
    (await http.get(`/workspaces/${workspaceId}/chat/${threadId}/messages`)).data,
  ask: async (workspaceId, values) => (await http.post(`/workspaces/${workspaceId}/chat`, values)).data
};

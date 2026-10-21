import http from './http';

export const runApi = {
  list: async (workspaceId) => (await http.get(`/workspaces/${workspaceId}/runs`)).data,
  get: async (runId) => (await http.get(`/runs/${runId}`)).data,
  summarize: async (workspaceId, values) =>
    (await http.post(`/workspaces/${workspaceId}/runs/summarize`, values)).data,
  compare: async (workspaceId, values) =>
    (await http.post(`/workspaces/${workspaceId}/runs/compare`, values)).data,
  actionItems: async (workspaceId, values) =>
    (await http.post(`/workspaces/${workspaceId}/runs/meeting-action-items`, values)).data,
  researchBrief: async (workspaceId, values) =>
    (await http.post(`/workspaces/${workspaceId}/runs/research-brief`, values)).data
};

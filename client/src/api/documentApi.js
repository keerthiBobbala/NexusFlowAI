import http from './http';

export const documentApi = {
  list: async (workspaceId) => (await http.get(`/workspaces/${workspaceId}/documents`)).data,
  upload: async (workspaceId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await http.post(`/workspaces/${workspaceId}/documents/upload`, formData)).data;
  },
  get: async (id) => (await http.get(`/documents/${id}`)).data,
  reprocess: async (id) => (await http.post(`/documents/${id}/reprocess`)).data,
  remove: async (id) => (await http.delete(`/documents/${id}`)).data
};

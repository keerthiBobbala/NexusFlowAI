import http from './http';

export const workspaceApi = {
  list: async () => (await http.get('/workspaces')).data,
  create: async (values) => (await http.post('/workspaces', values)).data,
  get: async (id) => (await http.get(`/workspaces/${id}`)).data,
  update: async (id, values) => (await http.patch(`/workspaces/${id}`, values)).data,
  remove: async (id) => (await http.delete(`/workspaces/${id}`)).data
};

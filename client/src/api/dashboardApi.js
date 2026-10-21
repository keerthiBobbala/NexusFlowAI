import http from './http';

export const dashboardApi = {
  get: async () => (await http.get('/dashboard')).data
};

import http from './http';

export const authApi = {
  register: async (values) => (await http.post('/auth/register', values)).data,
  login: async (values) => (await http.post('/auth/login', values)).data,
  me: async () => (await http.get('/auth/me')).data
};

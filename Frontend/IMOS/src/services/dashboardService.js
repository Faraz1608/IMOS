import api from './api';

export const getDashboardStats = (token) => {
  return api.get('/dashboard/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
};
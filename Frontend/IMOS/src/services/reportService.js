import api from './api';

export const getInventoryReport = (token) => {
  return api.get('/reports/inventory', {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob', // Important for file downloads
  });
};
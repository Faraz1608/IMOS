import api from './api';

export const getAgingReport = (token) => {
  return api.get('/analytics/aging-report', {
    headers: { Authorization: `Bearer ${token}` },
  });
};
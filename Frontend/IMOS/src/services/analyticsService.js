import api from './api.js';

export const getAgingReport = (token) => {
  return api.get('/analytics/aging-report', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// --- New Function ---
export const getDemandForecast = (token) => {
    return api.get('/analytics/demand-forecast', {
        headers: { Authorization: `Bearer ${token}` },
    });
};

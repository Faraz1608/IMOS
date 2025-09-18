import api from './api';

export const getInventoryReport = (token) => {
  return api.get('/reports/inventory', {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob', // Important for file downloads
  });
};

export const getStockoutReport = (token) => {
  return api.get('/reports/stockout', {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
};

export const getSlowMovingReport = (token) => {
  return api.get('/reports/slow-moving', {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
};

// --- NEW FUNCTION ---
export const getGiReport = (token) => {
  return api.get('/reports/gi-report', {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
};

// --- NEW FUNCTION ---
export const getGrReport = (token) => {
  return api.get('/reports/gr-report', {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
};
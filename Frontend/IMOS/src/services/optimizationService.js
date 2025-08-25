import api from './api';

export const runAbcAnalysis = (token) => {
  return api.post('/optimize/abc-analysis', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getSlottingRecommendations = (token) => {
  return api.get('/optimize/recommendations', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// --- NEW FUNCTION ---
export const generatePickingRoute = (items, token) => {
  return api.post('/optimize/picking-route', { items }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getLayoutStats = (layoutId, token) => {
  return api.get(`/layouts/${layoutId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
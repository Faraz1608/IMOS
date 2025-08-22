import api from './api';

export const getSkus = (token) => {
  return api.get('/skus', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createSku = (skuData, token) => {
  return api.post('/skus', skuData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const searchSkus = (query, token) => {
  return api.get(`/skus/search?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
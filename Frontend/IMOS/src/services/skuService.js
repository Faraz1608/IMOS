import api from './api';

export const getSkus = () => api.get('/skus');
export const createSku = (data) => api.post('/skus', data);
export const searchSkus = (query) => api.get(`/skus/search?q=${query}`);
export const getSkuById = (id) => api.get(`/skus/${id}`);
export const updateSku = (id, data) => api.put(`/skus/${id}`, data);
export const deleteSku = (id) => api.delete(`/skus/${id}`);
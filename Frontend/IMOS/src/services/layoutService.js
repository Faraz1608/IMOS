import api from './api.js';

export const getLayouts = () => api.get('/layouts');
export const createLayout = (data) => api.post('/layouts', data);
export const getLayoutById = (id) => api.get(`/layouts/${id}`);
export const updateLayout = (id, data) => api.put(`/layouts/${id}`, data);
export const deleteLayout = (id) => api.delete(`/layouts/${id}`);
export const getLayoutStats = (id) => api.get(`/layouts/${id}/stats`);
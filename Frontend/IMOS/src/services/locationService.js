import api from './api.js';

export const getLocationsByLayout = (layoutId) => api.get(`/layouts/${layoutId}/locations`);
export const createLocation = (layoutId, data) => api.post(`/layouts/${layoutId}/locations`, data);
export const updateLocation = (layoutId, locId, data) => api.put(`/layouts/${layoutId}/locations/${locId}`, data);
export const deleteLocation = (layoutId, locId) => api.delete(`/layouts/${layoutId}/locations/${locId}`);
export const getLocationStats = (layoutId, locId) => api.get(`/layouts/${layoutId}/locations/${locId}/stats`);
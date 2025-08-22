import api from './api.js';

export const getLocationsByLayout = (layoutId, token) => {
  return api.get(`/layouts/${layoutId}/locations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
export const createLocation = (layoutId, locationData, token) => {
  return api.post(`/layouts/${layoutId}/locations`, locationData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
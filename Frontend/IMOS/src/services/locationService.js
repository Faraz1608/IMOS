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
export const updateLocation = (layoutId, locationId, locationData, token) => {
  return api.put(`/layouts/${layoutId}/locations/${locationId}`, locationData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteLocation = (layoutId, locationId, token) => {
  return api.delete(`/layouts/${layoutId}/locations/${locationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
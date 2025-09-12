import api from './api';

export const getInventory = (token) => {
  return api.get('/inventory', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const setInventory = (inventoryData, token) => {
  return api.post('/inventory', inventoryData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getInventoryByLocation = (locationId, token) => {
  return api.get(`/inventory/location/${locationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const adjustInventory = (id, quantityData, token) => {
  return api.put(`/inventory/${id}`, quantityData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteInventory = (id, token) => {
  return api.delete(`/inventory/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// --- New Function to support slotting recommendations ---
export const moveInventory = (inventoryId, newLocationData, token) => {
  return api.put(`/inventory/${inventoryId}/move`, newLocationData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


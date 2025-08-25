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

// MODIFIED: Sends the new quantity to the specific item's URL
export const adjustInventory = (id, quantityData, token) => {
  return api.put(`/inventory/${id}`, quantityData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// MODIFIED: Calls the delete endpoint for the specific item's URL
export const deleteInventory = (id, token) => {
  return api.delete(`/inventory/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
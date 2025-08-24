import api from './api';

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
export const adjustInventory = (inventoryData, token) => {
  return api.put('/inventory', inventoryData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Add this function
export const deleteInventory = (inventoryData, token) => {
  return api.delete('/inventory', {
    headers: { Authorization: `Bearer ${token}` },
    data: inventoryData, // For DELETE requests, the body is sent in the 'data' property
  });
};
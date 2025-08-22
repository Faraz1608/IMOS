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
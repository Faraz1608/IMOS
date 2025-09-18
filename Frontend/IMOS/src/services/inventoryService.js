import api from './api';

export const getInventory = () => api.get('/inventory');
export const setInventory = (data) => api.post('/inventory', data);
export const getInventoryByLocation = (locationId) => api.get(`/inventory/location/${locationId}`);
export const adjustInventory = (id, data) => api.put(`/inventory/${id}`, data);
export const deleteInventory = (id) => api.delete(`/inventory/${id}`);
export const moveInventory = (id, data) => api.put(`/inventory/${id}/move`, data);
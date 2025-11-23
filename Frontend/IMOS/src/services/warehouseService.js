import api from './api.js';

export const getWarehouse = () => api.get('/warehouse');
export const createOrUpdateWarehouse = (data) => api.post('/warehouse', data);
export const getWarehouseLayouts = () => api.get('/warehouse/layouts'); // --- NEW ---
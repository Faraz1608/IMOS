import api from './api';

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getDetailedUtilization = () => api.get('/dashboard/utilization');
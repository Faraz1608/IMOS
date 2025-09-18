import api from './api';

export const getNotifications = () => api.get('/notifications');
export const markAllAsRead = () => api.put('/notifications/read-all');
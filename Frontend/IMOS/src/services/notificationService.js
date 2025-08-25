import api from './api';

export const getNotifications = (token) => {
  return api.get('/notifications', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const markAllAsRead = (token) => {
  return api.put('/notifications/read-all', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
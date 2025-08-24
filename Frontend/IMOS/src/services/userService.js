import api from './api';

export const getUsers = (token) => {
  return api.get('/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateUserRole = (userId, role, token) => {
  return api.put(`/users/${userId}/role`, { role }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
import api from './api';

export const search = (query, token) => {
  return api.get(`/search?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
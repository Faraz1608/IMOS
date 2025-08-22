import api from './api.js';

export const getLayouts = (token) => {
  return api.get('/layouts', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createLayout = (layoutData, token) => {
  return api.post('/layouts', layoutData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
export const getLayoutById = (id, token) => {
  return api.get(`/layouts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateLayout = (id, layoutData, token) => {
  return api.put(`/layouts/${id}`, layoutData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
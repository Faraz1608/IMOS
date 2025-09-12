import api from './api';

export const getDispatches = (token) => {
  return api.get('/dispatches', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createDispatch = (dispatchData, token) => {
  return api.post('/dispatches', dispatchData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateDispatchStatus = (id, status, token) => {
  return api.put(`/dispatches/${id}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
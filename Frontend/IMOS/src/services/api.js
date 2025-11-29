import axios from 'axios';
import useAuthStore from '../store/authStore';

// Change hardcoded URL to environment variable
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`, // Append /api here
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
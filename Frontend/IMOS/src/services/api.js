import axios from 'axios';
import useAuthStore from '../store/authStore'; // Import the auth store

const api = axios.create({
  baseURL: 'http://localhost:7000/api',
});

// This interceptor runs before each request is sent
api.interceptors.request.use(
  (config) => {
    // Get the token from your Zustand auth store
    const token = useAuthStore.getState().token;
    if (token) {
      // If the token exists, add it to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

export default api;
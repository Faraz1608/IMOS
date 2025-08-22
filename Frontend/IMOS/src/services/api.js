import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:7000/api', // Your backend API base URL
});

export default api;
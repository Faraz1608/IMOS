import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:7000/api', // Your backend API base URL
});

// Using "export default" ensures that other files can import it with `import api from './api.js'`
export default api;

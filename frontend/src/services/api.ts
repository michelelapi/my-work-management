import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: `${config.api.companyServiceUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - session expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch custom event to notify AuthContext about session expiration
      // This allows React Router navigation to be handled properly
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api; 
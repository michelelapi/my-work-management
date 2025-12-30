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
      const currentPath = window.location.pathname;
      
      // Only handle session expiration if not already on login page
      if (currentPath !== '/login' && currentPath !== '/register') {
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch custom event to notify AuthContext about session expiration
        // This allows React Router navigation to be handled properly
        window.dispatchEvent(new CustomEvent('session-expired', { 
          detail: { redirectTo: '/login?expired=true' } 
        }));
        
        // Fallback: Direct navigation if event doesn't work (e.g., during initial load)
        // Use setTimeout to allow React Router to handle it first
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true';
          }
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 
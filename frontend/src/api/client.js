import axios from 'axios';

// Use VITE_API_URL from environment or fallback to '/api' for local proxy
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
});

// Helper to resolve uploaded photo URLs (e.g. /uploads/... -> https://...onrender.com/uploads/...)
export const getPhotoUrl = (photoPath) => {
  if (!photoPath) return '';
  if (photoPath.startsWith('http') || photoPath.startsWith('data:')) {
    return photoPath;
  }
  // Strip trailing /api if present to get server origin
  const serverOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  return `${serverOrigin}${photoPath.startsWith('/') ? photoPath : `/${photoPath}`}`;
};

// Attach Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler (e.g. redirect on 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


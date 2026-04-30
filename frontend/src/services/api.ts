import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('buteco_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize paginated responses
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data && response.data.pagination) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('buteco_token');
      localStorage.removeItem('buteco_user');
      window.dispatchEvent(new Event('auth-changed'));
    }
    return Promise.reject(error);
  }
);

export default api;

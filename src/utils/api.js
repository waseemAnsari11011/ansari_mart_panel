import axios from 'axios';

export const BASE_URL = 'http://localhost:8000';
// export const BASE_URL = 'http://13.201.92.4';


const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const resolveImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('data:image')) return imagePath;
  return `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Add a request interceptor to include the token in headers
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

export default api;

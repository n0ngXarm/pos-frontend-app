import axios from 'axios';
import { useAuthStore } from '../stores/use-auth-store'; // ✅ ตรงกับชื่อไฟล์ use-auth-store.ts

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 300000, // 🔧 ปรับเป็น 5 นาที (แก้ปัญหา Server อืดแล้วตัดจบก่อน)
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
import axios from 'axios';
import { useAuthStore } from '../stores/use-auth-store'; // ✅ ตรงกับชื่อไฟล์ use-auth-store.ts

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 🔧 ปรับเป็น 5 นาที (แก้ปัญหา Server อืดแล้วตัดจบก่อน)
});

// ตัวแปรสำหรับจัดการ Queue ตอนกำลัง Refresh Token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
  async (error) => {
    const originalRequest = error.config;

    // ถ้าเจอ 401 และยังไม่ได้ลอง Retry (ป้องกัน Loop นรก)
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // ถ้ากำลัง Refresh อยู่ ให้คนอื่นเข้าคิวรอ
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 1. ดึง Refresh Token จาก Store
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        // 2. ยิงไปขอ Token ใหม่ (ใช้ axios ตัวใหม่เพื่อไม่ให้ติด Interceptor นี้ซ้ำ)
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

        // 3. อัปเดต Token ใน Store
        useAuthStore.getState().login(data.user, data.accessToken, data.refreshToken);

        // 4. บอกคนที่รอคิวว่า "ได้ตั๋วแล้วนะ ลุยต่อได้!"
        processQueue(null, data.accessToken);

        // 5. ยิง Request เดิมซ้ำด้วย Token ใหม่
        originalRequest.headers['Authorization'] = 'Bearer ' + data.accessToken;
        return api(originalRequest);

      } catch (err) {
        // ถ้า Refresh ไม่ผ่าน (เช่น Refresh Token ก็หมดอายุ) -> จบเกม ไปหน้า Login
        processQueue(err, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
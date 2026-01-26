import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// กำหนด Type ให้ชัดเจน
interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  name?: string;       // เพิ่มชื่อ
  avatar_url?: string; // เพิ่มรูปโปรไฟล์
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// กำหนด Type ให้ชัดเจน
interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  name?: string;       // เพิ่มชื่อ
  avatar_url?: string; // เพิ่มรูปโปรไฟล์
  is_plus_member?: boolean; // ✅ สถานะ User Plus (ผ่อนชำระ)
  credit_card_last4?: string; // ✅ เลขบัตร 4 ตัวท้าย
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null; // ✅ เพิ่ม refreshToken
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken?: string) => void; // ✅ รับ refreshToken (Optional)
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null, // ✅ ค่าเริ่มต้น
      isAuthenticated: false,
      // ✅ ปรับ login ให้เก็บ refreshToken (ถ้าไม่ส่งมา ให้ใช้ค่าเดิมที่มีอยู่)
      login: (user, token, refreshToken) => set((state) => ({ 
        user, 
        token, 
        isAuthenticated: true,
        refreshToken: refreshToken ?? state.refreshToken 
      })),
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
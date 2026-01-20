// src/features/auth/types/index.ts
import { z } from 'zod';

// Schema สำหรับ Validate Form หน้าบ้าน
export const LoginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(4, 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'),
});

// แปลง Schema เป็น Type เพื่อใช้ใน Code
export type LoginCredentials = z.infer<typeof LoginSchema>;

// หน้าตาของ User ที่ได้จาก Backend (เดาจากมาตรฐาน ถ้าไม่ตรงบอกนะครับ)
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: 'ADMIN' | 'USER';
    name?: string;
  };
}
// src/features/auth/api/login.ts
import { sha256 } from 'js-sha256';
import { api } from '../../../lib/axios';
import type { LoginCredentials, AuthResponse } from '../types';

export const loginWithUsername = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data: users } = await api.get<any[]>('/customers');

  const user = users.find((u) => u.username === credentials.username);

  if (!user) {
    throw new Error('ไม่พบชื่อผู้ใช้นี้ในระบบ');
  }

  // 👇 สูตรโกง: ถ้ากรอกรหัส "1234" ให้ผ่านเลย! (Dev Mode)
  const inputPasswordHash = sha256(credentials.password);
  
  if (credentials.password !== '1234' && inputPasswordHash !== user.password) {
    throw new Error('รหัสผ่านไม่ถูกต้อง');
  }

  return {
    token: 'mock-jwt-token-bypass',
    refreshToken: 'mock-refresh-token',
    user: {
      id: user.id.toString(),
      username: user.username,
      // แปลง status เป็น role
      role: user.status.toLowerCase() === 'admin' ? 'ADMIN' : 'USER',
      name: user.fullname || user.username,
    },
  };
};
// src/features/auth/api/login.ts
import { sha256 } from 'js-sha256'; // 👈 พระเอกของเรา
import { api } from '../../../lib/axios';
import type { LoginCredentials, AuthResponse } from '../types';

export const loginWithUsername = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // 1. แทนที่จะเคาะประตู /login ที่ไม่มีอยู่จริง เราไปขอกุญแจจาก /customers แทน
  // หมายเหตุ: ตรงนี้ต้องมั่นใจว่าใน axios.ts base URL เป็น http://localhost:5000/api แล้ว
  const { data: users } = await api.get<any[]>('/customers');

  // 2. ค้นหา User จากชื่อ (เช่น "Arm")
  const user = users.find((u) => u.username === credentials.username);

  // ถ้าหาไม่เจอ
  if (!user) {
    throw new Error('ไม่พบชื่อผู้ใช้นี้ในระบบ');
  }

  // 3. ตรวจสอบรหัสผ่าน
  // รหัสใน DB ถูก Hash มา (ยาวๆ มั่วๆ) เราต้องเอารหัสที่พิมพ์ไป Hash แบบเดียวกันก่อนเทียบ
  const inputPasswordHash = sha256(credentials.password);

  if (inputPasswordHash !== user.password) {
    throw new Error('รหัสผ่านไม่ถูกต้อง');
  }

  // 4. ถ้าผ่านหมด! ปั้นข้อมูลส่งกลับไปให้หน้าเว็บใช้งาน
  return {
    token: 'mock-jwt-token-because-backend-has-no-login', // Token ปลอมๆ (เพราะ Backend ไม่แจก)
    user: {
      id: user.id.toString(),
      username: user.username,
      // แปลง status 'admin'/'user' ให้เป็น Role ตัวใหญ่ตามที่เราออกแบบ
      role: user.status.toLowerCase() === 'admin' ? 'ADMIN' : 'USER',
      name: user.fullname || user.username,
    },
  };
};
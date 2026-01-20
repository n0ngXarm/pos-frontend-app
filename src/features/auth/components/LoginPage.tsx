// src/features/auth/components/LoginPage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/use-auth-store';
import { LoginForm } from './LoginForm';

export const LoginPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // ถ้า Login อยู่แล้ว ให้ดีดไป Dashboard เลย (ไม่ต้อง Login ซ้ำ)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      {/* ใส่ Logo หรือ Branding ตรงนี้ได้ */}
      <LoginForm />
    </div>
  );
};
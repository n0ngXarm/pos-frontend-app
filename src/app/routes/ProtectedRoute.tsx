// src/app/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/use-auth-store';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // ถ้าไม่มี Token ให้ Redirect ไปหน้า Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามี Token ให้ผ่านไปได้ (Render ลูกหลาน)
  return <Outlet />;
};
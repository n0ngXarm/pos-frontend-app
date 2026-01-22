// src/app/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/use-auth-store';

import { LoginPage } from '../../features/auth/components/LoginPage';
import { ShopListPage } from '../../features/shop/pages/ShopListPage';
import { ShopDetailPage } from '../../features/shop/pages/ShopDetailPage';
import { AdminShopListPage } from '../../features/admin/pages/AdminShopListPage';
import { AdminMenuManagePage } from '../../features/admin/pages/AdminMenuManagePage';
import { AdminOrderPage } from '../../features/admin/pages/AdminOrderPage';
import { CartPage } from '../../features/order/components/CartPage';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes = () => {
  const { user } = useAuthStore();

  const getHomeRoute = () => {
    if (user?.role === 'ADMIN') return '/admin/shops';
    return '/shops';
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* 🔐 พื้นที่หวงห้าม (ต้อง Login ถึงจะเข้าได้) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          
          {/* โซน ADMIN */}
          {user?.role === 'ADMIN' && (
            <>
              <Route path="/admin/shops" element={<AdminShopListPage />} />
              <Route path="/admin/shops/:id" element={<AdminMenuManagePage />} />
              <Route path="/admin/orders" element={<AdminOrderPage />} />
            </>
          )}

          {/* โซน USER (ย้ายกลับเข้ามาในนี้แล้ว!) */}
          {user?.role === 'USER' && (
            <>
              <Route path="/shops" element={<ShopListPage />} />
              <Route path="/shops/:id" element={<ShopDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
            </>
          )}

        </Route>
      </Route>

      {/* Redirect ไปหน้าแรกของแต่ละคน */}
      <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
      <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
    </Routes>
  );
};
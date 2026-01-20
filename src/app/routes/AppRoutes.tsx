// src/app/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import { LoginPage } from '../../features/auth/components/LoginPage';
import { ShopListPage } from '../../features/shop/pages/ShopListPage';
import { ShopDetailPage } from '../../features/shop/pages/ShopDetailPage'; // Import มาด้วย

// Import Layouts & Guards
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* -----------------------------------------------------------------
          🔓 Public Routes (โซนที่ใครก็เข้าได้)
      ------------------------------------------------------------------ */}
      <Route path="/login" element={<LoginPage />} />


      {/* -----------------------------------------------------------------
          🔐 Protected Routes (โซนต้องห้าม - ต้อง Login เท่านั้น)
      ------------------------------------------------------------------ */}
      <Route element={<ProtectedRoute />}>
        {/* ใช้ DashboardLayout ครอบ (มี Sidebar เมนูข้างซ้าย) */}
        <Route element={<DashboardLayout />}>
          
          {/* หน้าหลัก: พอล็อกอินเสร็จ ให้เจอหน้ารวมร้านค้าเลย */}
          <Route path="/dashboard" element={<ShopListPage />} />
          
          {/* Route สำหรับร้านค้าโดยเฉพาะ */}
          <Route path="/shops" element={<ShopListPage />} />
          <Route path="/shops/:id" element={<ShopDetailPage />} />

          {/* 🚧 พื้นที่สำหรับอนาคต (เดี๋ยวเรามาเติมกัน) */}
          {/* <Route path="/shops/:id" element={<ShopDetailPage />} /> */}
          {/* <Route path="/orders" element={<OrderHistoryPage />} /> */}
          
        </Route>
      </Route>


      {/* -----------------------------------------------------------------
          🔄 Redirect Logic (กันคนหลงทาง)
      ------------------------------------------------------------------ */}
      {/* ถ้าเข้าเว็บมาเปล่าๆ (/) ให้เด้งไป /dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ถ้าพิมพ์ URL มั่ว (404) ให้เด้งกลับมา /dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
};
// src/features/admin/DashboardPage.tsx
import { useAuthStore } from '../../stores/use-auth-store';

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">🎉 ยินดีต้อนรับ, {user?.username}</h1>
      <p className="text-gray-600 mb-8">นี่คือหน้า Dashboard (Protected Zone)</p>
      
      <button 
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        ออกจากระบบ
      </button>
    </div>
  );
};
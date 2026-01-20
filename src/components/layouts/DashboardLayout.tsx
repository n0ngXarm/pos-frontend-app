// src/components/layouts/DashboardLayout.tsx
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Coffee, ShoppingBag, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { useState } from 'react';

const cn = (...inputs: Array<string | false | null | undefined>) => {
  return inputs.filter(Boolean).join(' ');
};

export const DashboardLayout = () => {
  const { logout, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // เมนูนำทาง (เดี๋ยวเราปรับตาม Role ได้)
  const navItems = [
    { label: 'ภาพรวม', href: '/dashboard', icon: LayoutDashboard },
    { label: 'จัดการร้านค้า', href: '/shops', icon: Store },
    { label: 'รายการอาหาร', href: '/menus', icon: Coffee },
    { label: 'ออเดอร์', href: '/orders', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 1. Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white fixed h-full shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            POS System
          </h2>
          <p className="text-xs text-slate-400 mt-1">ยินดีต้อนรับ, {user?.username || 'Admin'}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 md:ml-64 p-8">
        {/* Mobile Header (โชว์เฉพาะมือถือ) */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm">
          <span className="font-bold text-slate-900">POS System</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* พื้นที่เจาะรู สำหรับแสดงเนื้อหาแต่ละหน้า */}
        <Outlet /> 
      </main>
    </div>
  );
};
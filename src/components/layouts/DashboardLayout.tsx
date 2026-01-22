// src/components/layouts/DashboardLayout.tsx
import { Outlet, NavLink } from 'react-router-dom';
import { Store, ShoppingBag, LogOut, Menu, ChefHat, X } from 'lucide-react'; // เพิ่ม icon X
import { useAuthStore } from '../../stores/use-auth-store';
import { useState } from 'react';
import { FloatingCart } from '../../features/order/components/FloatingCart';

const cn = (...inputs: Array<string | false | null | undefined>) => {
  return inputs.filter(Boolean).join(' ');
};

export const DashboardLayout = () => {
  const { logout, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. แยกเมนูตาม Role
  const adminNavItems = [
    { label: 'จัดการร้านค้า', href: '/admin/shops', icon: Store },
    { label: 'ห้องครัว (ออเดอร์)', href: '/admin/orders', icon: ChefHat },
  ];

  const userNavItems = [
    { label: 'เลือกร้านอาหาร', href: '/shops', icon: Store },
    { label: 'ตะกร้าสินค้า', href: '/cart', icon: ShoppingBag },
  ];

  const navItems = user?.role === 'ADMIN' ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      
      {/* 🌑 Overlay ฉากหลังมืดๆ (เฉพาะตอนเปิดเมนูในมือถือ) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)} // แตะฉากหลังเพื่อปิด
        />
      )}

      {/* 🚪 Sidebar (แก้ใหม่ให้รองรับทั้ง Desktop และ Mobile Slide-in) */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-full w-64 bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-in-out",
        // Desktop: โชว์ตลอดเวลา (translate-x-0)
        // Mobile: ถ้าเปิดให้โชว์ (translate-x-0) ถ้าปิดให้ซ่อน (-translate-x-full)
        "md:translate-x-0", 
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              POS System
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {user?.role === 'ADMIN' ? '👑 ผู้จัดการ' : '👋 ลูกค้า'}: {user?.username}
            </p>
          </div>
          {/* ปุ่มปิดเมนู (เฉพาะมือถือ) */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)} // กดเมนูแล้วปิด Sidebar อัตโนมัติ
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
              if(confirm('ออกจากระบบ?')) {
                logout();
                window.location.href = '/login';
              }
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen w-full">
        {/* Mobile Header Button */}
        <div className="md:hidden flex items-center mb-6">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-white rounded-lg shadow-sm text-slate-700 hover:bg-gray-50 border border-gray-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-bold text-slate-900 text-lg">
            {/* โชว์ชื่อหน้านิดหน่อย */}
            POS System
          </span>
        </div>

        <Outlet /> 
        
        {user?.role === 'USER' && <FloatingCart />}
      </main>
    </div>
  );
};
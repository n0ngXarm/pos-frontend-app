// src/components/layouts/DashboardLayout.tsx
import { Outlet, NavLink } from 'react-router-dom';
import { Store, ShoppingBag, LogOut, Menu, ChefHat, X, Settings } from 'lucide-react'; // เพิ่ม icon Settings
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
    { label: 'ตั้งค่าบัญชี', href: '/settings', icon: Settings }, // ✅ เพิ่มเมนู
  ];

  const userNavItems = [
    { label: 'เลือกร้านอาหาร', href: '/shops', icon: Store },
    { label: 'ตะกร้าสินค้า', href: '/cart', icon: ShoppingBag },
    { label: 'ตั้งค่าบัญชี', href: '/settings', icon: Settings }, // ✅ เพิ่มเมนู
  ];

  const navItems = user?.role === 'ADMIN' ? adminNavItems : userNavItems;

  // 🎨 Theme Config
  const isUser = user?.role === 'USER';
  
  // User Theme: Glassmorphism + Vibrant
  const userSidebarClass = "bg-white/90 backdrop-blur-xl border-r border-slate-200 shadow-xl";
  const userActiveClass = "bg-gradient-to-r from-slate-800 to-blue-900 text-amber-400 shadow-lg shadow-blue-900/20 scale-105 border-l-4 border-amber-400";
  const userInactiveClass = "text-slate-500 hover:bg-slate-50 hover:text-blue-800";

  // Admin Theme: Cyberpunk/Tech
  const adminSidebarClass = "bg-[#0f172a] border-r border-slate-800 shadow-2xl"; // Slate-950
  const adminActiveClass = "bg-blue-900/30 text-amber-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]";
  const adminInactiveClass = "text-slate-400 hover:bg-slate-900 hover:text-slate-200";

  return (
    <div className={`min-h-screen flex relative transition-colors duration-500 ${isUser ? 'bg-slate-50' : 'bg-[#0b1121]'}`}>
      
      {/* 🌑 Overlay ฉากหลังมืดๆ (เฉพาะตอนเปิดเมนูในมือถือ) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)} // แตะฉากหลังเพื่อปิด
        />
      )}

      {/* 🚪 Sidebar (แก้ใหม่ให้รองรับทั้ง Desktop และ Mobile Slide-in) */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 transition-transform duration-300 ease-out",
        // Desktop: โชว์ตลอดเวลา (translate-x-0)
        // Mobile: ถ้าเปิดให้โชว์ (translate-x-0) ถ้าปิดให้ซ่อน (-translate-x-full)
        "md:translate-x-0", 
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        isUser ? userSidebarClass : adminSidebarClass
      )}>
        <div className="h-24 flex items-center px-8 relative overflow-hidden">
          {/* Decorative Circle */}
          {isUser && <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>}
          
          <div>
            <h2 className={`text-3xl font-black tracking-tighter flex items-center gap-2 ${isUser ? 'text-slate-800' : 'text-white'}`}>
              {isUser ? <><span className="text-blue-800">Street</span><span className="text-amber-500">Eats</span></> : <><span className="text-amber-500">Kitchen</span>OS</>}
            </h2>
            <p className={`text-xs font-medium mt-1 ${isUser ? 'text-slate-400' : 'text-slate-500'}`}>
              {user?.role === 'ADMIN' ? 'System v2.0' : `Welcome, ${user?.username}`}
            </p>
          </div>
          {/* ปุ่มปิดเมนู (เฉพาะมือถือ) */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)} // กดเมนูแล้วปิด Sidebar อัตโนมัติ
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold group relative overflow-hidden",
                  isActive 
                    ? (isUser ? userActiveClass : adminActiveClass)
                    : (isUser ? userInactiveClass : adminInactiveClass)
                )
              }
            >
              <item.icon className={`w-6 h-6 transition-transform duration-300 ${isUser ? 'group-hover:rotate-12' : ''}`} />
              <span className="relative z-10">{item.label}</span>
              
              {/* Admin Hover Effect */}
              {!isUser && <div className="absolute inset-0 bg-blue-400/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />}
            </NavLink>
          ))}
        </nav>

        <div className={`p-6 border-t ${isUser ? 'border-gray-100' : 'border-slate-800'}`}>
          <button
            onClick={() => {
              if(confirm('ออกจากระบบ?')) {
                logout();
                window.location.href = '/login';
              }
            }}
            className="flex items-center gap-3 px-6 py-4 w-full text-stone-500 bg-stone-100 hover:bg-stone-200 hover:text-stone-700 rounded-2xl transition-all font-bold hover:shadow-md"
          >
            <LogOut className="w-5 h-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 min-h-screen w-full overflow-x-hidden">
        {/* Mobile Header Button */}
        <div className="md:hidden flex items-center mb-6">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`p-3 rounded-2xl shadow-sm border ${isUser ? 'bg-white text-slate-700 border-gray-100' : 'bg-slate-800 text-white border-slate-700'}`}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className={`ml-4 font-black text-xl ${isUser ? 'text-slate-800' : 'text-white'}`}>
            {/* โชว์ชื่อหน้านิดหน่อย */}
            {isUser ? 'StreetEats' : 'KitchenOS'}
          </span>
        </div>

        <Outlet /> 
        
        {user?.role === 'USER' && <FloatingCart />}
      </main>
    </div>
  );
};
// src/components/layouts/DashboardLayout.tsx
import { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Store, ShoppingBag, LogOut, ChefHat, Settings, Clock, User as UserIcon, Sun, Moon } from 'lucide-react'; // เพิ่ม icon Settings
import { useAuthStore } from '../../stores/use-auth-store';
import { useCartStore } from '../../stores/useCartStore';
import { ToastContainer } from '../ui/ToastContainer'; // ✅ Import ToastContainer
import { api } from '../../lib/axios';

const cn = (...inputs: Array<string | false | null | undefined>) => {
  return inputs.filter(Boolean).join(' ');
};

export const DashboardLayout = () => {
  const { logout, user, login, token } = useAuthStore();

  // ✅ State สำหรับ Theme (Dark/Light)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ตั้งค่าเริ่มต้น: ถ้าไม่ใช่ USER (เช่น Admin/Shop) ให้เป็น Dark Mode โดยอัตโนมัติ
  useEffect(() => {
    setIsDarkMode(user?.role !== 'USER');
  }, [user?.role]);

  // ✅ Sync ข้อมูล User ล่าสุดจาก Server เสมอ (แก้ปัญหา Logout แล้วสถานะหาย)
  useEffect(() => {
    const syncUserStatus = async () => {
      if (user?.id) {
        try {
          const { data } = await api.get(`/customers/${user.id}`);
          // ถ้าสถานะใน DB เป็น Plus แต่ใน Store ยังไม่ใช่ -> อัปเดต Store ทันที
          if (data.is_plus_member !== user.is_plus_member) {
            const updatedUser = { ...user, is_plus_member: data.is_plus_member };
            login(updatedUser, token || '');
          }
        } catch (error) {
          console.error("Failed to sync user status", error);
        }
      }
    };
    syncUserStatus();
  }, [user?.id]); // ทำงานเมื่อ user.id เปลี่ยน (เช่น ตอน Login ใหม่)
  
  // 🛒 ดึงจำนวนสินค้าในตะกร้ามาแสดง
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // 1. แยกเมนูตาม Role
  const adminNavItems = [
    { label: 'จัดการร้านค้า', href: '/admin/shops', icon: Store },
    { label: 'ห้องครัว (ออเดอร์)', href: '/admin/orders', icon: ChefHat },
    { label: 'ตั้งค่าบัญชี', href: '/settings', icon: Settings }, // ✅ เพิ่มเมนู
  ];

  const userNavItems = [
    { label: 'เลือกร้านอาหาร', href: '/shops', icon: Store },
    { label: 'ตะกร้าสินค้า', href: '/cart', icon: ShoppingBag },
    { label: 'ประวัติการสั่งซื้อ', href: '/orders', icon: Clock }, // 👈 เพิ่มเมนูนี้
    // ✅ เพิ่มเมนูพิเศษสำหรับ User Plus เท่านั้น
    ...(user?.is_plus_member ? [{ label: 'จัดการร้านของฉัน', href: '/my-shop', icon: ChefHat }] : []),
    { label: 'ตั้งค่าบัญชี', href: '/settings', icon: Settings }, // ✅ เพิ่มเมนู
  ];

  const navItems = user?.role === 'ADMIN' ? adminNavItems : userNavItems;

  // 🎨 Theme Config
  const isLight = !isDarkMode;
  
  // Dock Theme
  const dockContainerClass = isLight 
    ? "bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-blue-900/10" 
    : "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50";
    
  const activeItemClass = isLight
    ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/30 scale-110 -translate-y-3 ring-4 ring-white/50"
    : "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-110 -translate-y-3 ring-4 ring-slate-800/50";
    
  const inactiveItemClass = isLight
    ? "text-slate-400 hover:text-blue-700 hover:bg-blue-50/80"
    : "text-slate-500 hover:text-blue-400 hover:bg-slate-800/80";

  return (
    <div className={`min-h-screen flex relative transition-colors duration-500 overflow-hidden ${isLight ? 'bg-slate-50' : 'bg-slate-950 dark'}`}>
      
      {/* ✨ Global Styles & Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.5); }
      `}</style>

      {/* 🔔 ระบบแจ้งเตือน Global Popup */}
      <ToastContainer />

      {/* 1. Top Bar (Logo & Profile) */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-4 md:px-8 md:py-6 flex justify-between items-center pointer-events-none">
         {/* Logo Area */}
         <div className={`pointer-events-auto px-5 py-3 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 shadow-lg ${isLight ? 'bg-white/80 backdrop-blur-md border border-white/60' : 'bg-slate-900/80 backdrop-blur-md border border-slate-700'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isLight ? 'bg-gradient-to-br from-blue-600 to-indigo-800' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tighter leading-none drop-shadow-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {isLight ? <><span className="text-blue-800">Street</span><span className="text-amber-500">Eats</span></> : <><span className="text-white">Kitchen</span><span className="text-blue-400">OS</span></>}
              </h2>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.role === 'ADMIN' ? 'Admin Panel' : 'Food Delivery'}
              </p>
            </div>
         </div>

         {/* Profile / Logout Area */}
         <div className="pointer-events-auto flex items-center gap-3">
            {/* 🌗 Theme Toggle Button */}
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-2xl transition-all shadow-lg hover:scale-110 active:scale-95 ${isLight ? 'bg-white/80 text-amber-500 border border-white/60' : 'bg-slate-900/80 text-blue-400 border border-slate-700'}`}
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className={`pl-4 pr-2 py-2 rounded-2xl flex items-center gap-3 shadow-lg ${isLight ? 'bg-white/80 backdrop-blur-md border border-white/60' : 'bg-slate-900/80 backdrop-blur-md border border-slate-700'}`}>
               <div className="text-right hidden md:block">
                 <p className={`text-xs font-bold ${isLight ? 'text-gray-700' : 'text-white'}`}>{user?.username}</p>
                 <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>{user?.role}</p>
               </div>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'}`}>
                 <UserIcon className="w-5 h-5" />
               </div>
               <button
                  onClick={() => {
                    if(confirm('ออกจากระบบ?')) {
                      logout();
                      window.location.href = '/login';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  title="ออกจากระบบ"
               >
                  <LogOut className="w-5 h-5" />
               </button>
            </div>
         </div>
      </header>

      {/* 2. Main Content */}
      <main className="pt-24 md:pt-32 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen w-full">
        {/* 🌟 Dynamic Backgrounds (แบบเคลื่อนไหวได้) */}
        {isLight ? (
          <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-slate-50">
            {/* 1. Moving Gradient Base (พื้นหลังไล่สีเคลื่อนไหว) */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-amber-50/50 animate-bg-move opacity-80"></div>
            
            {/* 2. Vibrant Orbs (ลูกบอลสีสดๆ ลอยไปมา) */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-purple-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob animation-delay-4000"></div>
            
            {/* 3. Noise Texture (เพิ่มความแพง) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
          </div>
        ) : (
          <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-slate-950">
             {/* Cyberpunk Grid Effect */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
             <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-900 opacity-20 blur-[100px] animate-pulse"></div>
          </div>
        )}

        <Outlet /> 
      </main>

      {/* 3. Floating Bottom Dock (Navigation) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90vw]">
        <div className={`rounded-full p-2 flex items-center gap-2 md:gap-4 ${dockContainerClass}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 group relative",
                    isActive ? activeItemClass : inactiveItemClass
                  )
                }
              >
                <item.icon className="w-6 h-6 md:w-7 md:h-7" />
                
                {/* 🔴 Notification Badge สำหรับตะกร้าสินค้า */}
                {item.href === '/cart' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white animate-bounce">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}

                {/* Tooltip */}
                <span className="absolute -top-10 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {item.label}
                </span>
              </NavLink>
            ))}
        </div>
      </nav>
    </div>
  );
};
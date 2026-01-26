// src/components/layouts/DashboardLayout.tsx
import { Outlet, NavLink } from 'react-router-dom';
import { Store, ShoppingBag, LogOut, ChefHat, Settings, Clock, User as UserIcon } from 'lucide-react'; // เพิ่ม icon Settings
import { useAuthStore } from '../../stores/use-auth-store';

const cn = (...inputs: Array<string | false | null | undefined>) => {
  return inputs.filter(Boolean).join(' ');
};

export const DashboardLayout = () => {
  const { logout, user } = useAuthStore();

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
    { label: 'ตั้งค่าบัญชี', href: '/settings', icon: Settings }, // ✅ เพิ่มเมนู
  ];

  const navItems = user?.role === 'ADMIN' ? adminNavItems : userNavItems;

  // 🎨 Theme Config
  const isUser = user?.role === 'USER';
  
  // Dock Theme
  const dockContainerClass = isUser 
    ? "bg-white/90 backdrop-blur-2xl border border-white/40 shadow-2xl shadow-gray-500/10" 
    : "bg-gray-900/90 backdrop-blur-2xl border border-gray-700 shadow-2xl shadow-black/50";
    
  const activeItemClass = isUser
    ? "bg-gradient-to-br from-blue-900 to-gray-700 text-white shadow-lg shadow-blue-900/30 scale-110 -translate-y-2"
    : "bg-blue-900 text-white shadow-lg shadow-blue-900/30 scale-110 -translate-y-2";
    
  const inactiveItemClass = isUser
    ? "text-gray-400 hover:text-blue-900 hover:bg-blue-50"
    : "text-gray-400 hover:text-white hover:bg-gray-800";

  return (
    <div className={`min-h-screen flex relative transition-colors duration-500 overflow-hidden ${isUser ? 'bg-gray-50' : 'bg-gray-950'}`}>
      
      {/* 🎬 Custom Animations (ใส่ Style ตรงนี้เพื่อให้ทำงานได้ทันที) */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        /* 🔥 เพิ่ม Animation พื้นหลังเคลื่อนไหว (Gradient Move) */
        @keyframes gradient-move {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-bg-move {
            background-size: 300% 300%;
            animation: gradient-move 12s ease infinite;
        }
      `}</style>

      {/* 1. Top Bar (Logo & Profile) */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-4 md:px-8 md:py-6 flex justify-between items-center pointer-events-none">
         {/* Logo Area */}
         <div className={`pointer-events-auto backdrop-blur-xl px-5 py-3 rounded-2xl shadow-sm border flex items-center gap-3 transition-all hover:scale-105 ${isUser ? 'bg-white/90 border-white/50' : 'bg-gray-900/90 border-gray-700'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${isUser ? 'bg-gradient-to-br from-amber-400 to-yellow-600' : 'bg-blue-900'}`}>
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tighter leading-none ${isUser ? 'text-gray-800' : 'text-white'}`}>
                {isUser ? <><span className="text-blue-900">Street</span><span className="text-amber-500">Eats</span></> : <><span className="text-amber-500">Kitchen</span>OS</>}
              </h2>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.role === 'ADMIN' ? 'Admin Panel' : 'Food Delivery'}
              </p>
            </div>
         </div>

         {/* Profile / Logout Area */}
         <div className="pointer-events-auto flex items-center gap-3">
            <div className={`backdrop-blur-xl pl-4 pr-2 py-2 rounded-2xl shadow-sm border flex items-center gap-3 ${isUser ? 'bg-white/90 border-white/50' : 'bg-gray-900/90 border-gray-700'}`}>
               <div className="text-right hidden md:block">
                 <p className={`text-xs font-bold ${isUser ? 'text-gray-700' : 'text-white'}`}>{user?.username}</p>
                 <p className={`text-[10px] ${isUser ? 'text-gray-400' : 'text-gray-500'}`}>{user?.role}</p>
               </div>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUser ? 'bg-gray-100 text-gray-600' : 'bg-gray-800 text-gray-300'}`}>
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
        {isUser ? (
          <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-gray-50">
            {/* 1. Moving Gradient Base (พื้นหลังไล่สีเคลื่อนไหว) */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-amber-50 animate-bg-move opacity-80"></div>
            
            {/* 2. Vibrant Orbs (ลูกบอลสีสดๆ ลอยไปมา) */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-900 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-gray-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-4000"></div>
            
            {/* 3. Noise Texture (เพิ่มความแพง) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
          </div>
        ) : (
          <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-gray-950">
             {/* Cyberpunk Grid Effect */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
             <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-900 opacity-20 blur-[100px] animate-pulse"></div>
          </div>
        )}

        <Outlet /> 
      </main>

      {/* 3. Floating Bottom Dock (Navigation) */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90vw]">
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
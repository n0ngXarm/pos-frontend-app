// src/components/layouts/DashboardLayout.tsx
import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Store, ShoppingBag, LogOut, ChefHat, Settings, Clock, User as UserIcon, Sun, Moon, Wallet, FileText, CreditCard, CheckCircle2, X, Landmark, Loader2, AlertTriangle, Menu, Bell, Search, ChevronRight, ShieldCheck } from 'lucide-react'; // เพิ่ม icon Settings
import { useAuthStore } from '../../stores/use-auth-store';
import { useCartStore } from '../../stores/useCartStore';
import { ToastContainer } from '../ui/ToastContainer'; // ✅ Import ToastContainer
import { api } from '../../lib/axios';

const cn = (...inputs: Array<string | false | null | undefined>) => {
  return inputs.filter(Boolean).join(' ');
};

// ✅ รายชื่อธนาคารสำหรับ Dropdown
const THAI_BANKS = [
  { id: 'KBANK', name: 'ธนาคารกสิกรไทย (KBANK)' },
  { id: 'SCB', name: 'ธนาคารไทยพาณิชย์ (SCB)' },
  { id: 'KTB', name: 'ธนาคารกรุงไทย (KTB)' },
  { id: 'BBL', name: 'ธนาคารกรุงเทพ (BBL)' },
  { id: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา (BAY)' },
  { id: 'TTB', name: 'ธนาคารทหารไทยธนชาต (TTB)' },
  { id: 'GSB', name: 'ธนาคารออมสิน (GSB)' },
  { id: 'BAAC', name: 'ธ.ก.ส. (BAAC)' },
];

export const DashboardLayout = () => {
  const { logout, user, login, token } = useAuthStore();
  const location = useLocation();

  // ✅ State สำหรับ Theme (Dark/Light)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false); // ✅ Modal ถอนเงิน
  const [withdrawAmount, setWithdrawAmount] = useState(''); // ✅ จำนวนเงินที่จะถอน
  const [balance, setBalance] = useState(0); // ✅ ยอดเงินที่ถอนได้
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [bankName, setBankName] = useState(''); // ✅ ชื่อธนาคาร (กรณีไม่มีบัตร)
  const [accountNumber, setAccountNumber] = useState(''); // ✅ เลขบัญชี (กรณีไม่มีบัตร)

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
        } catch (error: any) {
          console.error("Failed to sync user status", error);
          // ✅ Fix: ถ้าหา User ไม่เจอ (404) หรือ Server Error (500 - มักเกิดจาก DB Reset) ให้ Logout อัตโนมัติ
          if (error.response && (error.response.status === 404 || error.response.status === 500)) {
            logout();
          }
        }
      }
    };
    syncUserStatus();
  }, [user?.id]); // ทำงานเมื่อ user.id เปลี่ยน (เช่น ตอน Login ใหม่)
  
  // 🛒 ดึงจำนวนสินค้าในตะกร้ามาแสดง
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // ✅ Fetch Balance เมื่อเปิด Modal
  useEffect(() => {
    if (showWithdrawModal && user?.is_plus_member) {
      const fetchBalance = async () => {
        setIsLoadingBalance(true);
        try {
            // 1. หา Restaurant ของ User คนนี้
            const { data: restaurants } = await api.get('/restaurants');
            console.log("Debug - User ID:", user.id);
            
            const myShop = restaurants.find((r: any) => 
                String(r.owner_id) === String(user.id) || Number(r.owner_id) === Number(user.id)
            );
            console.log("Debug - Found Shop:", myShop ? `ID: ${myShop.id}` : "Not Found");
            console.log("Debug - My Shop:", myShop);
            

            if (myShop) {
                // 2. ดึง Orders ของร้านนี้ (รวม Paid และ Completed)
                const { data: orders } = await api.get('/orders');
                
                // ✅ รองรับทั้ง id และ restaurant_id (แปลงเป็น String เพื่อความชัวร์ในการเทียบ)
                const shopIds = [myShop.id, myShop.restaurant_id].filter(Boolean).map(id => String(id));
                
                const shopOrders = orders.filter((o: any) => {
                    // 1. ต้องเป็นออเดอร์ของร้านเรา
                    // ✅ Fix: รองรับ field restaurantId (camelCase) และ restaurant_id (snake_case)
                    const orderRestaurantId = o.restaurant_id || o.restaurantId;
                    const isMyShop = shopIds.includes(String(orderRestaurantId));
                    
                    // 2. สถานะต้องไม่ใช่ "รอจ่าย" หรือ "ยกเลิก" (รวม paid, preparing, ready, completed, credit_pending)
                    // ✅ Fix: Normalize status เป็น lowercase เพื่อป้องกัน case sensitivity issue
                    const status = String(o.order_status || o.status || '').toLowerCase();
                    
                    // ⚠️ แก้ไขแบบสุดซอย: นับทุกสถานะ ยกเว้นที่มีคำว่า "cancel" (ยกเลิก)
                    // เพื่อให้มั่นใจว่ายอดขายขึ้นแน่นอน ไม่ว่าจะเป็น pending, paid, completed, ready ฯลฯ
                    const isValidStatus = !status.includes('cancel');
                    
                    // Debug: ช่วยตรวจสอบว่าทำไมออเดอร์ถึงไม่ถูกนับ
                    if (isMyShop && !isValidStatus) {
                        console.log(`Order ${o.id} ignored due to status: ${status}`);
                    }

                    // ✅ นับรวมทุกช่องทางชำระเงิน (รวม Cash) เพื่อให้เห็นยอดรายได้ทั้งหมด
                    return isMyShop && isValidStatus;
                });
                
                // 3. คำนวณยอดรวม
                const totalSales = shopOrders.reduce((sum: number, o: any) => {
                    // รองรับกรณีราคาเป็น String ที่มีลูกน้ำ (เช่น "1,200.00")
                    // ✅ Fix: ใช้ Regex ดึงเฉพาะตัวเลขและจุดทศนิยม (ตัด ฿, ลูกน้ำ, ตัวหนังสือออกหมด)
                    const rawPrice = o.total_price || o.totalPrice || 0;
                    const cleanPrice = String(rawPrice).replace(/[^0-9.-]+/g, "");
                    const price = parseFloat(cleanPrice);

                    return sum + (isNaN(price) ? 0 : price);
                }, 0);
                
                console.log(`Debug - Total Sales: ${totalSales} from ${shopOrders.length} orders`);
                
                // ✅ หักค่าบริการ Platform 1% (ตามหน้า Dashboard)
                const gpDeduction = totalSales * 0.01; 
                const netIncome = totalSales - gpDeduction;
                
                setBalance(netIncome);
            } else {
                setBalance(0);
            }
        } catch (error) {
            console.error("Failed to fetch balance", error);
            setBalance(0);
        } finally {
            setIsLoadingBalance(false);
        }
      };
      fetchBalance();
    }
  }, [showWithdrawModal, user]);

  // ✅ ฟังก์ชันส่งคำร้องถอนเงิน (ย้ายมาจาก SettingsPage)
  const handleWithdrawSubmit = () => {
    const amount = Number(withdrawAmount);

    if (!withdrawAmount || amount <= 0) {
        alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');
        return;
    }
    
    // 1. เช็คยอดเงิน
    if (amount > balance) {
        alert(`ยอดเงินในบัญชีไม่เพียงพอ (มีอยู่ ฿${balance.toLocaleString()})`);
        return;
    }

    // 2. เช็คบัญชีรับเงิน (ถ้าไม่มีบัตรผูกไว้ ต้องกรอก)
    if (!user?.credit_card_last4) {
        if (!bankName.trim() || !accountNumber.trim()) {
            alert('กรุณาระบุชื่อธนาคารและเลขบัญชีเพื่อรับเงิน');
            return;
        }
    }
    
    // จำลองการส่งคำร้อง
    const confirmMsg = user?.credit_card_last4 
        ? `ยืนยันการส่งคำร้องขอถอนเงินจำนวน ${amount.toLocaleString()} บาท?`
        : `ยืนยันการโอนเงิน ${amount.toLocaleString()} บาท เข้าบัญชี ${bankName} (${accountNumber})?`;

    const confirm = window.confirm(confirmMsg);
    if (confirm) {
        // Simulate API delay
        setTimeout(() => {
            alert('✅ ส่งคำร้องเรียบร้อยแล้ว\n\nระบบได้รับเอกสารคำร้องของท่านแล้ว กรุณารอการตรวจสอบและโอนเงินคืนภายใน 2-3 วันทำการ');
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            setBankName('');
            setAccountNumber('');
        }, 500);
    }
  };

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
    ...(user?.is_plus_member ? [
      { label: 'จัดการร้านของฉัน', href: '/my-shop', icon: ChefHat },
      { label: 'ถอนเงิน', icon: Wallet, onClick: () => setShowWithdrawModal(true) } // ✅ ปุ่มถอนเงิน (Action)
    ] : []),
    { label: 'ตั้งค่าบัญชี', href: '/settings', icon: Settings }, // ✅ เพิ่มเมนู
  ];

  const navItems = user?.role === 'ADMIN' ? adminNavItems : userNavItems;

  // 🎨 Theme Config
  const isLight = !isDarkMode;
  
  return (
    <div className={`min-h-screen flex relative transition-colors duration-500 overflow-hidden font-sans ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100 dark'}`}>
      
      {/* ✨ Global Styles & Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .glass-panel-light { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); }
      `}</style>

      {/* 🔔 ระบบแจ้งเตือน Global Popup */}
      <ToastContainer />

      {/* 🌟 Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isLight ? (
          <>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[120px] animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 left-0 w-full h-full bg-slate-950"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px] animate-blob"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-amber-900/5 rounded-full blur-[150px] animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          </>
        )}
      </div>

      {/* 🖥️ Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-72 fixed inset-y-0 left-0 z-50 border-r transition-all duration-300 ${isLight ? 'bg-white/80 border-slate-200/50' : 'bg-slate-900/80 border-white/5'} backdrop-blur-xl`}>
         {/* Logo Area */}
         <div className="h-24 flex items-center px-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none">
                  <span className="text-blue-600 dark:text-blue-400">Kitchen</span>
                  <span className="text-amber-500">OS</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Enterprise</p>
              </div>
            </div>
         </div>

         {/* Navigation */}
         <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
            {navItems.map((item, idx) => (
              item.href ? (
              <NavLink
                key={item.href || idx}
                to={item.href}
                className={({ isActive }) => `relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20 translate-x-1' 
                    : 'hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
                    <span className={`font-medium tracking-wide ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                    )}
                    {item.href === '/cart' && cartCount > 0 && (
                      <span className="absolute right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
              ) : (
                // ✅ กรณีเป็นปุ่ม Action (เช่น ถอนเงิน)
                <button
                  key={idx}
                  onClick={item.onClick}
                  className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group overflow-hidden w-full text-left hover:bg-slate-100 dark:hover:bg-white/5`}
                >
                  <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  <span className="font-medium tracking-wide text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                    {item.label}
                  </span>
                </button>
              )
            ))}
         </nav>

         {/* User Profile Footer */}
         <div className={`p-4 m-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
            <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                  {user?.username?.charAt(0).toUpperCase()}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user?.username}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.role}</p>
               </div>
            </div>
            <div className="flex gap-2">
               <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="flex-1 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
               >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
               </button>
               <button 
                  onClick={() => { if(confirm('Logout?')) logout(); }}
                  className="flex-1 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
               >
                  <LogOut className="w-4 h-4" />
               </button>
            </div>
         </div>
      </aside>

      {/* 📱 Mobile Header & Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-72 min-h-screen relative z-10">
         {/* Header */}
         <header className={`h-20 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all duration-300 ${isLight ? 'bg-white/80 border-b border-slate-200/50' : 'bg-slate-900/80 border-b border-white/5'} backdrop-blur-md`}>
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <ChefHat className="w-5 h-5" />
               </div>
               <span className="font-bold text-lg text-slate-900 dark:text-white">KitchenOS</span>
            </div>

            {/* Desktop Breadcrumbs / Title */}
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
               <span className="hover:text-blue-500 cursor-pointer">Dashboard</span>
               <ChevronRight className="w-4 h-4" />
               <span className="text-slate-900 dark:text-white font-medium">Overview</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 md:gap-4">
               <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className={`pl-10 pr-4 py-2 rounded-full text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isLight ? 'bg-slate-100 border-transparent focus:bg-white' : 'bg-white/5 border-white/10 focus:bg-black/20 text-white'}`}
                  />
               </div>
               <button className={`p-2.5 rounded-full relative transition-all ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-300'}`}>
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
               </button>
               <div className="md:hidden">
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-full ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-300'}`}>
                     {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
               </div>
            </div>
         </header>

         {/* Main Content */}
         <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 md:pb-8">
            <Outlet />
         </main>
      </div>

      {/* 📱 Mobile Bottom Dock */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className={`rounded-2xl p-2 flex items-center justify-around shadow-2xl border ${isLight ? 'bg-white/90 border-white/50 shadow-slate-200/50' : 'bg-slate-900/90 border-white/10 shadow-black/50'} backdrop-blur-xl`}>
            {navItems.map((item, idx) => {
              const isActive = item.href ? location.pathname === item.href : false;
              const Icon = item.icon;
              
              if (!item.href && !item.onClick) return null;

              return (
                <button
                  key={idx}
                  onClick={() => item.href ? window.location.href = item.href : item.onClick?.()}
                  className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 -translate-y-4 scale-110' 
                      : 'text-slate-400 hover:text-blue-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.href === '/cart' && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {cartCount}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </nav>

      {/* 📄 Withdrawal Modal (ย้ายมาไว้ Global) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className={`rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] ${isLight ? 'bg-white' : 'bg-slate-900 border border-white/10'}`}>
                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-start ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Withdraw Funds</h3>
                            <p className="text-xs text-slate-500">Transfer earnings to your account</p>
                        </div>
                    </div>
                    <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Balance Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Available Balance</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black tracking-tight">฿{isLoadingBalance ? '...' : balance.toLocaleString()}</span>
                            <span className="text-sm opacity-80">THB</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-blue-200 bg-black/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            <ShieldCheck className="w-3 h-3" /> Secure Transaction
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">฿</span>
                                <input 
                                    type="number" 
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3.5 rounded-xl border outline-none font-mono text-lg font-bold transition-all focus:ring-2 focus:ring-blue-500 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/20 border-white/10 text-white'}`}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {!user?.credit_card_last4 && (
                            <div className="space-y-4 pt-2">
                                <div className="p-3 border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center text-amber-700 dark:text-amber-400 text-xs flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Please provide bank details
                                </div>
                                <select 
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm appearance-none cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/20 border-white/10 text-white'}`}
                                >
                                    <option value="">-- Select Bank --</option>
                                    {THAI_BANKS.map((bank) => (
                                        <option key={bank.id} value={bank.name}>{bank.name}</option>
                                    ))}
                                </select>
                                <input 
                                    type="text"
                                    placeholder="Account Number"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none font-mono text-sm ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/20 border-white/10 text-white'}`}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t flex justify-end gap-3 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                    <button onClick={() => setShowWithdrawModal(false)} className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
                    <button 
                        onClick={handleWithdrawSubmit} 
                        disabled={isLoadingBalance}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoadingBalance ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
                        Confirm Withdrawal
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
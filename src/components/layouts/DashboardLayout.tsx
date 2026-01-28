// src/components/layouts/DashboardLayout.tsx
import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  Store, ShoppingBag, LogOut, ChefHat, Settings, Clock, User as UserIcon, Sun, Moon, Wallet, 
  Search, ChevronRight, ShieldCheck, Sparkles, LayoutDashboard, ChevronLeft, Bell, X
} from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { useCartStore } from '../../stores/useCartStore';
import { ToastContainer } from '../ui/ToastContainer';
import { api } from '../../lib/axios';

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

  // State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // 🧱 Sidebar Collapse State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  // Initial Theme Setup
  useEffect(() => {
    if (isAdmin) {
        setIsDarkMode(true); // Admin บังคับ Dark Mode
    } else {
        setIsDarkMode(user?.role !== 'USER');
    }
  }, [user?.role, isAdmin]);

  // Sync User Status
  useEffect(() => {
    const syncUserStatus = async () => {
      if (user?.id) {
        try {
          const { data } = await api.get(`/customers/${user.id}`);
          if (data.is_plus_member !== user.is_plus_member) {
            login({ ...user, is_plus_member: data.is_plus_member }, token || '');
          }
        } catch (error: any) {
          if (error.response && (error.response.status === 404 || error.response.status === 500)) {
            logout();
          }
        }
      }
    };
    syncUserStatus();
  }, [user?.id]);
  
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Fetch Balance Logic (Preserved)
  useEffect(() => {
    if (showWithdrawModal && user?.is_plus_member) {
      const fetchBalance = async () => {
        setIsLoadingBalance(true);
        try {
            const { data: restaurants } = await api.get('/restaurants');
            const myShop = restaurants.find((r: any) => 
                String(r.owner_id) === String(user.id) || Number(r.owner_id) === Number(user.id)
            );

            if (myShop) {
                const { data: orders } = await api.get('/orders');
                const shopIds = [myShop.id, myShop.restaurant_id].filter(Boolean).map(id => String(id));
                const shopOrders = orders.filter((o: any) => {
                    const orderRestaurantId = o.restaurant_id || o.restaurantId;
                    const isMyShop = shopIds.includes(String(orderRestaurantId));
                    const status = String(o.order_status || o.status || '').toLowerCase();
                    const isValidStatus = !status.includes('cancel');
                    return isMyShop && isValidStatus;
                });
                
                const totalSales = shopOrders.reduce((sum: number, o: any) => {
                    const rawPrice = o.total_price || o.totalPrice || 0;
                    const cleanPrice = String(rawPrice).replace(/[^0-9.-]+/g, "");
                    const price = parseFloat(cleanPrice);
                    return sum + (isNaN(price) ? 0 : price);
                }, 0);
                
                const gpDeduction = totalSales * 0.01; 
                setBalance(totalSales - gpDeduction);
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

  // Withdraw Submit Logic (Preserved)
  const handleWithdrawSubmit = () => {
    const amount = Number(withdrawAmount);
    if (!withdrawAmount || amount <= 0) { alert('กรุณาระบุจำนวนเงินที่ถูกต้อง'); return; }
    if (amount > balance) { alert(`ยอดเงินในบัญชีไม่เพียงพอ (มีอยู่ ฿${balance.toLocaleString()})`); return; }
    if (!user?.credit_card_last4 && (!bankName.trim() || !accountNumber.trim())) { alert('กรุณาระบุชื่อธนาคารและเลขบัญชี'); return; }
    
    if (confirm(`ยืนยันการถอนเงินจำนวน ${amount.toLocaleString()} บาท?`)) {
        setTimeout(() => {
            alert('✅ ส่งคำร้องเรียบร้อยแล้ว\n\nระบบได้รับเอกสารคำร้องของท่านแล้ว กรุณารอการตรวจสอบและโอนเงินคืนภายใน 2-3 วันทำการ');
            setShowWithdrawModal(false);
            setWithdrawAmount('');
        }, 500);
    }
  };

  // Define a type for navigation items to handle mixed href/onClick
  type NavItem = {
    label: string;
    icon: any;
    href?: string;
    onClick?: () => void;
  };

  // Navigation Items
  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'จัดการร้านค้า', href: '/admin/shops', icon: Store },
    { label: 'ออเดอร์', href: '/admin/orders', icon: ChefHat },
    { label: 'ตั้งค่า', href: '/settings', icon: Settings },
  ];

  const userNavItems: NavItem[] = [
    { label: 'เลือกร้าน', href: '/shops', icon: Store },
    { label: 'ตะกร้า', href: '/cart', icon: ShoppingBag },
    { label: 'ประวัติ', href: '/orders', icon: Clock },
    ...(user?.is_plus_member ? [
      { label: 'ร้านของฉัน', href: '/my-shop', icon: ChefHat },
      { label: 'ถอนเงิน', icon: Wallet, onClick: () => setShowWithdrawModal(true) }
    ] : [
      { label: 'สมัคร User Plus', href: '/settings', icon: Sparkles }
    ]),
    { label: 'ตั้งค่า', href: '/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;
  const isLight = !isDarkMode;
  
  return (
    <div className={`min-h-screen flex relative transition-colors duration-700 overflow-hidden font-sans ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020617] text-slate-100'}`}>
      
      <ToastContainer />

      {/* 🌟 Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isLight ? (
          <>
            <div className="absolute inset-0 bg-[#F8FAFC]"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] opacity-60"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-amber-50/60 rounded-full blur-[120px] opacity-60"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#0B1120]"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]"></div>
            {!isAdmin && (
                <>
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[150px] animate-blob"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-amber-900/20 rounded-full blur-[150px] animate-blob animation-delay-4000"></div>
                </>
            )}
          </>
        )}
      </div>

      {/* 🖥️ Desktop Sidebar (Fixed & Collapsible) */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-50 border-r transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'} ${isLight ? 'bg-white/70 border-slate-200/50' : 'bg-[#0F172A] border-slate-800'} backdrop-blur-2xl`}>
         {/* Logo */}
         <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-8'} relative overflow-hidden border-b border-slate-800/50`}>
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${isLight ? 'bg-blue-600 text-white' : 'bg-blue-900 text-amber-500'}`}>
                <ChefHat className="w-6 h-6" />
              </div>
              {!isSidebarCollapsed && (
                  <div>
                    <h1 className={`text-lg font-bold tracking-tight leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Street<span className={isLight ? 'text-blue-600' : 'text-amber-500'}>Eats</span>
                    </h1>
                    <p className={`text-[10px] font-medium uppercase tracking-wider mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAdmin ? 'Control Panel' : 'Premium Delivery'}
                    </p>
                  </div>
              )}
            </div>
         </div>

         {/* Nav */}
         <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {!isSidebarCollapsed && <p className={`px-4 text-[10px] font-bold uppercase tracking-widest mb-4 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>Main Menu</p>}
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              return item.href ? (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) => `
                    relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                    ${isActive 
                        ? (isLight ? 'bg-blue-50 text-blue-700' : 'bg-slate-800 text-amber-400 border-l-2 border-amber-500') 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400'}
                    ${isSidebarCollapsed ? 'justify-center' : ''}
                    ${item.label === 'สมัคร User Plus' && !isActive ? 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10' : ''}
                  `}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                  {({ isActive }) => (
                    <>
                        <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                        {!isSidebarCollapsed && <span className="font-medium text-sm tracking-wide">{item.label}</span>}
                        {item.href === '/cart' && cartCount > 0 && !isSidebarCollapsed && (
                          <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {cartCount}
                          </span>
                        )}
                    </>
                  )}
                </NavLink>
              ) : (
                <button
                  key={idx}
                  onClick={item.onClick || (() => {})}
                  className={`
                    relative w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left text-slate-500 dark:text-slate-400
                    ${isSidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                    <Icon className="w-5 h-5 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                    {!isSidebarCollapsed && <span className="font-medium text-sm tracking-wide">{item.label}</span>}
                </button>
              );
            })}
         </nav>

         {/* Footer Profile */}
         <div className="p-3 border-t border-slate-800/50">
           <div className={`p-3 rounded-xl border backdrop-blur-md ${isLight ? 'bg-white/60 border-slate-200/60' : 'bg-slate-800/30 border-slate-700/50'}`}>
              <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                 <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                 </div>
                 {!isSidebarCollapsed && (
                     <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{user?.username}</p>
                        <p className={`text-[10px] font-mono uppercase tracking-wider ${user?.is_plus_member ? 'text-amber-500 font-bold' : 'text-slate-500'}`}>
                            {user?.role === 'ADMIN' ? 'ADMINISTRATOR' : user?.is_plus_member ? '✨ PLUS MEMBER' : 'GENERAL USER'}
                        </p>
                     </div>
                 )}
              </div>
              {!isSidebarCollapsed && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                     {!isAdmin && (
                         <button onClick={() => setIsDarkMode(!isDarkMode)} className={`py-1.5 rounded-lg flex items-center justify-center transition-all border ${isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}>
                            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                         </button>
                     )}
                     <button onClick={() => confirm('Logout?') && logout()} className={`py-1.5 rounded-lg flex items-center justify-center transition-all border ${isAdmin ? 'col-span-2 bg-red-900/20 border-red-900/30 text-red-400 hover:bg-red-900/40' : 'bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600'}`}>
                        <LogOut className="w-4 h-4" /> {isAdmin && <span className="ml-2 text-xs font-bold">LOGOUT</span>}
                     </button>
                  </div>
              )}
           </div>
         </div>
         
         {/* Collapse Toggle Button */}
         <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-24 bg-slate-800 border border-slate-700 text-slate-400 p-1 rounded-full shadow-lg hover:text-white transition-colors"
         >
            {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
         </button>
      </aside>

      {/* 📱 Mobile Content Wrapper */}
      <div className={`flex-1 flex flex-col ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} min-h-screen relative z-10 transition-all duration-300`}>
         {/* Header (Top Bar) */}
         <header className={`h-16 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all duration-300 ${isLight ? 'bg-white/80 border-b border-slate-200/50' : 'bg-[#0B1120]/90 border-b border-slate-800'} backdrop-blur-xl`}>
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center text-amber-500 shadow-md">
                  <ChefHat className="w-5 h-5" />
               </div>
            </div>

            {/* Desktop Breadcrumbs / Search */}
            <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl">
               {isAdmin ? (
                   <div className="relative w-full">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                       <input 
                          type="text" 
                          placeholder="Global Search (Orders, Users, Logs)..." 
                          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600"
                       />
                   </div>
               ) : (
                   <div className="flex items-center gap-2 text-sm">
                       <span className="text-slate-400">Dashboard</span>
                       <ChevronRight className="w-4 h-4 text-slate-600" />
                       <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-amber-200'}`}>Overview</span>
                   </div>
               )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
               {isAdmin && (
                   <div className="flex items-center gap-2 mr-4">
                       <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                       <span className="text-xs font-mono text-slate-400">SYSTEM: ONLINE</span>
                   </div>
               )}
               <button className={`p-2 rounded-full relative transition-transform hover:scale-105 ${isLight ? 'bg-white border border-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-amber-400'}`}>
                  <Bell className="w-4 h-4" />
                  {isAdmin && <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-800"></span>}
               </button>
            </div>
         </header>

         {/* Main Content Area */}
         <main className="flex-1 p-4 md:p-6 w-full max-w-[1600px] mx-auto pb-28 md:pb-8 overflow-x-hidden">
            <Outlet />
         </main>
      </div>

      {/* 📱 Mobile Floating Dock (Hidden for Admin to force desktop usage or simplified view) */}
      {!isAdmin && (
          <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
            <div className={`rounded-2xl px-6 py-3 flex items-center justify-between shadow-xl backdrop-blur-xl border ${isLight ? 'bg-white/90 border-slate-200/50 shadow-slate-200/50' : 'bg-[#0F172A]/90 border-white/10 shadow-black/50'}`}>
                {navItems.map((item, idx) => {
                  const isActive = item.href ? location.pathname === item.href : false;
                  if (!item.href && !('onClick' in item)) return null;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => item.href ? window.location.href = item.href : (item.onClick && item.onClick())}
                      className="relative group flex flex-col items-center justify-center"
                    >
                      <div className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${isActive ? (isLight ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 -translate-y-2' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 -translate-y-2') : 'text-slate-400'}`}>
                         <item.icon className="w-5 h-5" />
                         {item.href === '/cart' && cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900">
                               {cartCount}
                            </span>
                         )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </nav>
      )}

      {/* 💎 Luxury Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-md rounded-3xl relative overflow-hidden shadow-2xl border transition-all transform scale-100 ${isLight ? 'bg-white border-white/50' : 'bg-[#0F172A] border-amber-500/30'}`}>
                {/* Gold Header Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
                
                <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                           <h3 className={`text-2xl font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>Withdraw</h3>
                           <p className="text-sm text-slate-400">Transfer earnings to your bank</p>
                        </div>
                        <button onClick={() => setShowWithdrawModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Balance Card (Gold/Blue Gradient) */}
                    <div className={`p-6 rounded-2xl mb-6 relative overflow-hidden shadow-lg ${isLight ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-amber-600 to-amber-800'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10 text-white">
                            <p className="text-sm opacity-80 font-medium mb-1">Available Balance</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black tracking-tight text-shadow">฿{isLoadingBalance ? '...' : balance.toLocaleString()}</span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider opacity-70">
                                <ShieldCheck className="w-3 h-3" /> Encrypted & Secure
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="space-y-5">
                        <div className="relative">
                            <label className={`absolute -top-2.5 left-4 px-1 text-xs font-bold ${isLight ? 'bg-white text-slate-500' : 'bg-[#0F172A] text-slate-400'}`}>Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">฿</span>
                                <input 
                                    type="number" 
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-4 rounded-xl border-2 outline-none font-mono text-xl font-bold transition-all focus:ring-0 ${isLight ? 'bg-slate-50 border-slate-100 focus:border-blue-500 text-slate-900' : 'bg-white/5 border-white/10 focus:border-amber-500 text-white'}`}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {!user?.credit_card_last4 && (
                            <div className="space-y-4 animate-slide-up">
                                <select 
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'}`}
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
                                    className={`w-full px-4 py-3.5 rounded-xl border outline-none font-mono text-sm ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}
                                />
                            </div>
                        )}

                        <button 
                            onClick={handleWithdrawSubmit} 
                            disabled={isLoadingBalance}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isLight ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 shadow-amber-500/20'}`}
                        >
                            {isLoadingBalance ? 'Processing...' : 'Confirm Withdrawal'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
// src/components/layouts/DashboardLayout.tsx
import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Store, ShoppingBag, LogOut, ChefHat, Settings, Clock, User as UserIcon, Sun, Moon, Wallet, FileText, CheckCircle2, X, AlertTriangle, Search, ChevronRight, ShieldCheck, CreditCard, Sparkles, Menu } from 'lucide-react';
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
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Initial Theme Setup
  useEffect(() => {
    setIsDarkMode(user?.role !== 'USER');
  }, [user?.role]);

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

  // Navigation Items
  const adminNavItems = [
    { label: 'จัดการร้านค้า', href: '/admin/shops', icon: Store },
    { label: 'ออเดอร์', href: '/admin/orders', icon: ChefHat },
    { label: 'ตั้งค่า', href: '/settings', icon: Settings },
  ];

  const userNavItems = [
    { label: 'เลือกร้าน', href: '/shops', icon: Store },
    { label: 'ตะกร้า', href: '/cart', icon: ShoppingBag },
    { label: 'ประวัติ', href: '/orders', icon: Clock },
    ...(user?.is_plus_member ? [
      { label: 'ร้านของฉัน', href: '/my-shop', icon: ChefHat },
      { label: 'ถอนเงิน', icon: Wallet, onClick: () => setShowWithdrawModal(true) }
    ] : []),
    { label: 'ตั้งค่า', href: '/settings', icon: Settings },
  ];

  const navItems = user?.role === 'ADMIN' ? adminNavItems : userNavItems;
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
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[150px] animate-blob"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-amber-900/20 rounded-full blur-[150px] animate-blob animation-delay-4000"></div>
          </>
        )}
      </div>

      {/* 🖥️ Desktop Sidebar (Luxury Glass) */}
      <aside className={`hidden md:flex flex-col w-72 fixed inset-y-0 left-0 z-50 border-r transition-all duration-300 ${isLight ? 'bg-white/70 border-slate-200/50' : 'bg-[#0F172A]/80 border-white/5'} backdrop-blur-2xl`}>
         {/* Logo */}
         <div className="h-28 flex items-center px-8 relative overflow-hidden">
            {/* <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isLight ? 'from-blue-400 to-amber-400' : 'from-blue-600 to-amber-500'}`}></div> */}
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${isLight ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'}`}>
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-tight leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Street<span className={isLight ? 'text-blue-600' : 'text-amber-400'}>Eats</span>
                </h1>
                <p className={`text-[10px] font-medium uppercase tracking-wider mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {user?.role === 'ADMIN' ? 'Admin Console' : 'Premium Delivery'}
                </p>
              </div>
            </div>
         </div>

         {/* Nav */}
         <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            <p className={`px-4 text-[10px] font-bold uppercase tracking-widest mb-4 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>Main Menu</p>
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const content = (isActive: boolean) => (
                <>
                    {/* <div className={`absolute left-0 w-1 h-8 rounded-r-full transition-all duration-300 ${isActive ? 'bg-amber-500 scale-y-100' : 'bg-transparent scale-y-0'}`}></div> */}
                    <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-blue-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    <span className={`font-medium tracking-wide transition-colors ${isActive ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                      {item.label}
                    </span>
                    {item.href === '/cart' && cartCount > 0 && (
                      <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {cartCount}
                      </span>
                    )}
                </>
              );

              return item.href ? (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) => `relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive ? 'bg-blue-50 dark:bg-white/5 text-blue-700 dark:text-white' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {({ isActive }) => content(isActive)}
                </NavLink>
              ) : (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-slate-50 dark:hover:bg-white/5 text-left"
                >
                  {content(false)}
                </button>
              );
            })}
         </nav>

         {/* Footer Profile */}
         <div className="p-4">
           <div className={`p-4 rounded-2xl border backdrop-blur-md ${isLight ? 'bg-white/60 border-slate-200/60 shadow-sm' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full p-0.5 bg-slate-100 dark:bg-slate-800">
                    <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                       <UserIcon className="w-5 h-5 text-white" />
                    </div>
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-amber-100'}`}>{user?.username}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className={`py-2 rounded-lg flex items-center justify-center transition-all border ${isLight ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600' : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`}>
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                 </button>
                 <button onClick={() => confirm('Logout?') && logout()} className="py-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 flex items-center justify-center transition-all border border-transparent hover:border-red-200">
                    <LogOut className="w-4 h-4" />
                 </button>
              </div>
           </div>
         </div>
      </aside>

      {/* 📱 Mobile Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-72 min-h-screen relative z-10 transition-all duration-500">
         {/* Header (Glass) */}
         <header className={`h-16 md:h-20 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all duration-300 ${isLight ? 'bg-white/80 border-b border-slate-200/50' : 'bg-[#020617]/80 border-b border-white/5'} backdrop-blur-xl`}>
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <ChefHat className="w-5 h-5" />
               </div>
               <span className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Street<span className="text-blue-600">Eats</span></span>
            </div>

            {/* Desktop Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-sm">
               <span className="text-slate-400">Dashboard</span>
               <ChevronRight className="w-4 h-4 text-slate-600" />
               <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-amber-200'}`}>Overview</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
               <div className="md:hidden">
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-full ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-amber-200'}`}>
                     {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
               </div>
               <button className={`p-2 rounded-full relative transition-transform hover:scale-105 ${isLight ? 'bg-white border border-slate-200 text-slate-600' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                  <Sparkles className="w-4 h-4" />
               </button>
               {/* Avatar for Mobile */}
               <div className="md:hidden w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold">
                 {user?.username?.charAt(0).toUpperCase()}
               </div>
            </div>
         </header>

         {/* Main Content Area */}
         <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto pb-28 md:pb-8">
            <Outlet />
         </main>
      </div>

      {/* 📱 Mobile Floating Dock (เกาะลอยหรูหรา) */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className={`rounded-2xl px-6 py-3 flex items-center justify-between shadow-xl backdrop-blur-xl border ${isLight ? 'bg-white/90 border-slate-200/50 shadow-slate-200/50' : 'bg-[#0F172A]/90 border-white/10 shadow-black/50'}`}>
            {navItems.map((item, idx) => {
              const isActive = item.href ? location.pathname === item.href : false;
              if (!item.href && !item.onClick) return null;
              
              return (
                <button
                  key={idx}
                  onClick={() => item.href ? window.location.href = item.href : item.onClick?.()}
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
                  {/* {isActive && <div className={`absolute -bottom-2 w-1 h-1 rounded-full ${isLight ? 'bg-blue-600' : 'bg-amber-400'}`}></div>} */}
                </button>
              );
            })}
        </div>
      </nav>

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
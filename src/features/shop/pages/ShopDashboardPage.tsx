import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, DollarSign, Clock, ChefHat, CheckCircle, Wallet, 
  Utensils, RefreshCw, Bell, History, XCircle, BarChart3
} from 'lucide-react';
import { useAuthStore } from '../../../stores/use-auth-store';
import { getRestaurants, getOrders, updateOrderStatus, getMenusByRestaurantId } from '../api/shopService';

export const ShopDashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [myShop, setMyShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [chartPeriod, setChartPeriod] = useState<'1D' | '5D' | '1M' | '1Y' | '5Y'>('1D');
  
  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformFee: 0,
    netProfit: 0,
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0
  });

  // Sound Alert
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevActiveCount = useRef(0); // ✅ Track active orders count for sound

  // ✅ ปรับลดค่าบริการ Platform เหลือ 1%
  const PLATFORM_FEE_PERCENT = 1;

  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    fetchShopData();
    const interval = setInterval(fetchShopData, 5000); // Auto refresh 5s
    return () => clearInterval(interval);
  }, [user]);

  const fetchShopData = async () => {
    if (!user) return;
    try {
      // 1. หาร้านของฉัน
      const allShops = await getRestaurants();
      // console.log("🏪 All Shops:", allShops);

      // ✅ ใช้ String comparison เพื่อความชัวร์ และเช็คทั้ง owner_id และ id
      const shop = allShops.find((s: any) => String(s.owner_id) === String(user.id));
      
      if (!shop) {
        navigate('/register-shop');
        return;
      }
      setMyShop(shop);

      // เตรียม ID ร้านค้า (เผื่อบางที Backend ส่ง id หรือ restaurant_id)
      const myShopId = String(shop.restaurant_id || shop.id);

      // 2. (NEW) ดึงเมนูทั้งหมดของร้านเพื่อใช้ Cross-Check
      // แก้ปัญหา Backend ไม่ส่ง restaurant_id มาในออเดอร์
      let shopMenuIds = new Set<string>();
      let shopMenuNames = new Set<string>(); // ✅ เพิ่ม: เก็บชื่อเมนูด้วย
      try {
        const myMenus = await getMenusByRestaurantId(shop.restaurant_id || shop.id);
        if (Array.isArray(myMenus)) {
            myMenus.forEach((m: any) => {
                shopMenuIds.add(String(m.menu_id));
                if (m.menu_name) shopMenuNames.add(m.menu_name); // ✅ เก็บชื่อเมนูไว้เทียบ
            });
        }
      } catch (err) {
        console.warn("Could not fetch menus for validation", err);
      }

      // 3. ดึงออเดอร์ทั้งหมดและกรองเฉพาะของร้านฉัน (ใช้ 2 วิธีควบคู่กัน)
      const allOrders = await getOrders();
      // console.log("📦 All Orders (Raw):", allOrders);
      
      const myOrders = Array.isArray(allOrders) 
        ? allOrders.filter((o: any) => {
            // วิธี 1: เช็ค ID ร้านตรงๆ (ถ้ามี)
            const isShopMatch = o.restaurant_id && String(o.restaurant_id) === myShopId;
            // วิธี 2: เช็คว่าสั่งเมนูของร้านเราหรือไม่ (สำรองกรณีวิธี 1 พลาด)
            const isMenuMatch = o.menu_id && shopMenuIds.has(String(o.menu_id));
            // วิธี 3: เช็คชื่อเมนู (Fallback สุดท้าย กรณี Backend ไม่ส่ง ID อะไรมาเลยนอกจากชื่อ)
            const isNameMatch = o.menu_name && shopMenuNames.has(o.menu_name);
            
            return isShopMatch || isMenuMatch || isNameMatch;
        })
        : [];
      
      // console.log("🎯 My Orders (Filtered):", myOrders);

      // เรียงลำดับ: ออเดอร์ใหม่สุดขึ้นก่อน
      myOrders.sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
      setOrders(myOrders);

      // 4. Logic การกรอง Active Orders (รวม paid, pending_payment, pending, cooking, credit_pending, waiting)
      // ✅ เพิ่ม 'waiting' และทำให้เป็นตัวพิมพ์เล็กทั้งหมดเพื่อความชัวร์
      const activeStatus = ['pending', 'paid', 'cooking', 'pending_payment', 'credit_pending', 'waiting'];
      const activeOrdersList = myOrders.filter((o: any) => activeStatus.includes((o.order_status || '').toLowerCase()));
      const activeCount = activeOrdersList.length;

      // 5. คำนวณยอดเงิน
      const revenueOrders = myOrders.filter((o: any) => ['paid', 'completed'].includes(o.order_status));
      const totalRevenue = revenueOrders.reduce((sum: number, o: any) => sum + Number(o.total_price), 0);
      const platformFee = (totalRevenue * PLATFORM_FEE_PERCENT) / 100;

      setStats({
        totalRevenue,
        platformFee,
        netProfit: totalRevenue - platformFee,
        totalOrders: myOrders.length,
        completedOrders: myOrders.filter((o: any) => o.order_status === 'completed').length,
        cancelledOrders: myOrders.filter((o: any) => o.order_status === 'cancelled').length,
        pendingOrders: activeCount
      });

      // 6. Sound Alert Logic (แจ้งเตือนเมื่อมีออเดอร์ใหม่เข้ามาใน Active List)
      if (activeCount > prevActiveCount.current) {
        audioRef.current?.play().catch(e => console.log("Audio play failed", e));
      }
      prevActiveCount.current = activeCount;

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  const handleStatusUpdate = async (orderId: number, status: string) => {
    if (status === 'cancelled' && !confirm(`ยืนยันการยกเลิกออเดอร์ #${orderId}?`)) return;
    
    try {
      await updateOrderStatus(orderId, status);
      fetchShopData(); // โหลดข้อมูลใหม่ทันที
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // 📊 Chart Data Calculation
  const getChartData = () => {
    const now = new Date();
    let data: number[] = [];
    let labels: string[] = [];
    
    // กรองเฉพาะออเดอร์ที่สำเร็จแล้วเพื่อนำมาคำนวณยอดขาย
    const completedOrders = orders.filter(o => ['paid', 'completed'].includes(o.order_status));

    if (chartPeriod === '1D') {
        data = new Array(24).fill(0);
        labels = new Array(24).fill(0).map((_, i) => `${i}:00`);
        completedOrders.forEach(o => {
            const d = new Date(o.order_date);
            if (d.toDateString() === now.toDateString()) data[d.getHours()] += Number(o.total_price);
        });
    } else if (chartPeriod === '5D') {
        for (let i = 4; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('th-TH', { weekday: 'short' }));
            const total = completedOrders
                .filter(o => new Date(o.order_date).toDateString() === d.toDateString())
                .reduce((sum, o) => sum + Number(o.total_price), 0);
            data.push(total);
        }
    } else if (chartPeriod === '1M') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        data = new Array(daysInMonth).fill(0);
        labels = new Array(daysInMonth).fill(0).map((_, i) => `${i + 1}`);
        completedOrders.forEach(o => {
            const d = new Date(o.order_date);
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) data[d.getDate() - 1] += Number(o.total_price);
        });
    } else if (chartPeriod === '1Y') {
        data = new Array(12).fill(0);
        labels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        completedOrders.forEach(o => {
            const d = new Date(o.order_date);
            if (d.getFullYear() === now.getFullYear()) data[d.getMonth()] += Number(o.total_price);
        });
    } else if (chartPeriod === '5Y') {
        for (let i = 4; i >= 0; i--) {
            const year = now.getFullYear() - i;
            labels.push(String(year));
            const total = completedOrders.filter(o => new Date(o.order_date).getFullYear() === year).reduce((sum, o) => sum + Number(o.total_price), 0);
            data.push(total);
        }
    }
    return { data, labels, max: Math.max(...data, 1) };
  };

  const chartData = getChartData();

  // Filter Orders based on Tab
  const activeStatusList = ['pending', 'paid', 'cooking', 'pending_payment', 'credit_pending', 'waiting'];
  const activeOrders = orders.filter(o => 
    activeStatusList.includes((o.order_status || '').toLowerCase())
  );
  const historyOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.order_status));

  if (isLoading) return <div className="p-10 text-center animate-pulse">กำลังโหลดข้อมูลร้านค้า...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            {myShop?.restaurant_name || 'My Shop'}
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wider uppercase">Dashboard</span>
          </h1>
          <p className="text-gray-500 dark:text-slate-400">KDS System & Sales Dashboard</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => navigate(`/shops/${myShop?.restaurant_id}/manage`)}
                className="px-5 py-2.5 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white border border-gray-200 text-slate-700 rounded-xl font-bold hover:bg-gray-50 hover:scale-105 transition-all flex items-center gap-2 shadow-sm"
            >
                <Utensils className="w-4 h-4" /> จัดการเมนู
            </button>
            <button onClick={fetchShopData} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 hover:rotate-180 transition-all shadow-lg shadow-slate-200">
                <RefreshCw className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* 💰 Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ยอดขายรวม */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-amber-500/30 relative overflow-hidden md:col-span-2 group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 opacity-90 font-bold text-amber-100">
                    <DollarSign className="w-5 h-5" /> ยอดขายรวม (Gross)
                </div>
                <div className="text-5xl font-black mb-2 tracking-tight">฿{stats.totalRevenue.toLocaleString()}</div>
                <div className="flex items-center gap-4 mt-6 text-sm text-amber-100 font-medium">
                    <span>📦 {stats.totalOrders} ออเดอร์ทั้งหมด</span>
                    <span>✅ {stats.completedOrders} สำเร็จ</span>
                </div>
            </div>
        </div>

        {/* รายละเอียดการเงิน */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 md:col-span-2 flex flex-col justify-center">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-600" /> สรุปยอดรายได้
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-600 dark:text-slate-300">
                    <span>ยอดขายรวม</span>
                    <span className="font-bold text-slate-900 dark:text-white">฿{stats.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-red-500">
                    <span>หักค่าบริการ Platform ({PLATFORM_FEE_PERCENT}%)</span>
                    <span>-฿{stats.platformFee.toLocaleString()}</span>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="flex justify-between items-center text-green-600 text-lg font-black">
                    <span>รายรับสุทธิ</span>
                    <span>฿{stats.netProfit.toLocaleString()}</span>
                </div>
            </div>
        </div>
      </div>

      {/* 📊 Sales Chart Section */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" /> Analytics
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {(['1D', '5D', '1M', '1Y', '5Y'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setChartPeriod(p)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartPeriod === p ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="h-64 flex items-end gap-2 md:gap-4">
            {chartData.data.map((value, idx) => (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                        ฿{value.toLocaleString()}
                    </div>
                    {/* Bar */}
                    <div 
                        className="w-full bg-blue-100 dark:bg-slate-700 rounded-t-md relative overflow-hidden transition-all duration-500 group-hover:bg-blue-200 dark:group-hover:bg-slate-600"
                        style={{ height: `${(value / chartData.max) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
                    >
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500 h-full opacity-80"></div>
                    </div>
                    {/* Label */}
                    <span className="text-[10px] text-slate-400 mt-2 truncate w-full text-center">{chartData.labels[idx]}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
        <button 
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'active' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
        >
            <Bell className="w-4 h-4" /> ออเดอร์ปัจจุบัน (KDS)
            {stats.pendingOrders > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{stats.pendingOrders}</span>}
        </button>
        <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
        >
            <History className="w-4 h-4" /> ประวัติออเดอร์
        </button>
      </div>

      {/* 🍳 Active Orders (KDS Grid View) */}
      {activeTab === 'active' && (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeOrders.map((order) => {
                    const status = (order.order_status || 'pending').toLowerCase(); // Default เป็น pending ถ้าไม่มีค่า
                    return (
                    <div 
                        key={order.order_id} 
                        className={`
                            relative flex flex-col rounded-[1.5rem] border shadow-sm overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 duration-300 group
                            ${status === 'cooking' ? 'bg-slate-900 border-amber-500/50 ring-2 ring-amber-500/50 shadow-amber-900/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}
                        `}
                    >
                        {/* Card Header */}
                        <div className={`px-6 py-4 border-b flex justify-between items-center ${status === 'cooking' ? 'bg-amber-900/20 border-amber-800/50' : 'bg-slate-50/50 dark:bg-slate-700/30 dark:border-slate-700'}`}>
                            <div className="flex items-center gap-2">
                                <span className={`text-xl font-black ${status === 'cooking' ? 'text-white' : 'text-gray-700'}`}>#{order.order_id}</span>
                                <span className={`text-xs flex items-center gap-1 ${status === 'cooking' ? 'text-slate-400' : 'text-gray-500'}`}>
                                    <Clock className="w-3 h-3" />
                                    {new Date(order.order_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className={`
                                text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                                ${status === 'cooking' ? 'bg-amber-500 text-white animate-pulse' : 
                                  status === 'paid' || status === 'completed' ? 'bg-green-100 text-green-700' :
                                  (status === 'pending_payment' || status === 'waiting') ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-200 text-gray-600'}
                            `}>
                                {status === 'cooking' ? 'Cooking' : 
                                 status === 'paid' ? 'Paid (Verified)' :
                                 (status === 'pending_payment' || status === 'waiting') ? 'รอตรวจสอบ (Verifying)' : 'Pending'}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center gap-4 dark:text-white">
                            <h3 className={`text-2xl font-black line-clamp-2 leading-tight ${status === 'cooking' ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                                {order.menu_name || `Menu ${order.menu_id}`}
                            </h3>
                            
                            {/* Quantity (Big Font) */}
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className={`text-sm font-medium ${status === 'cooking' ? 'text-slate-400' : 'text-gray-400 dark:text-slate-500'}`}>QTY</span>
                                <span className={`text-6xl font-black tracking-tighter ${status === 'cooking' ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-800 dark:text-white'}`}>
                                    {order.quantity}
                                </span>
                            </div>
                            <p className={`text-sm font-medium ${status === 'cooking' ? 'text-slate-400' : 'text-gray-400'}`}>฿{Number(order.total_price).toLocaleString()}</p>
                        </div>

                        {/* Card Actions */}
                        <div className={`grid grid-cols-2 border-t ${status === 'cooking' ? 'border-slate-700 divide-slate-700' : 'border-slate-100 dark:border-slate-700 divide-slate-100 dark:divide-slate-700'}`}>
                            {status === 'cooking' ? (
                                <button 
                                    onClick={() => handleStatusUpdate(order.order_id, 'completed')}
                                    className="col-span-2 py-5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> เสร็จสิ้น (Complete)
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => handleStatusUpdate(order.order_id, 'cancelled')}
                                        className="py-5 hover:bg-red-50 text-red-500 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                                    >
                                        <XCircle className="w-4 h-4" /> ยกเลิก
                                    </button>
                                    <button 
                                        onClick={() => handleStatusUpdate(order.order_id, 'cooking')}
                                        className="py-5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                                    >
                                        {/* ✅ ถ้าสถานะเป็น pending_payment ให้ปุ่มเป็น "ยืนยันยอด" แทน */}
                                        {(status === 'pending_payment' || status === 'waiting') ? (
                                            <><CheckCircle className="w-4 h-4" /> ยืนยันยอด & ปรุง</>
                                        ) : (
                                            <><ChefHat className="w-4 h-4" /> ปรุงอาหาร</>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )})}
                
                {activeOrders.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                        <ChefHat className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">ไม่มีออเดอร์ที่ต้องทำในขณะนี้</p>
                        <p className="text-sm opacity-60">พักผ่อนสักครู่ แล้วรอลุยต่อ!</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* 📜 Order History */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">ID</th>
                        <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">เมนู</th>
                        <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">วันที่</th>
                        <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">สถานะ</th>
                        <th className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-right">ยอดเงิน</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {historyOrders.map((order) => (
                        <tr key={order.order_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="p-4 text-slate-500 dark:text-slate-400">#{order.order_id}</td>
                            <td className="p-4 font-medium text-slate-900 dark:text-white">
                                {order.menu_name} <span className="text-slate-400 text-xs">x{order.quantity}</span>
                            </td>
                            <td className="p-4 text-slate-500 text-sm">
                                {new Date(order.order_date).toLocaleString('th-TH')}
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    order.order_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {order.order_status === 'completed' ? 'สำเร็จ' : 'ยกเลิก'}
                                </span>
                            </td>
                            <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                                ฿{Number(order.total_price).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {historyOrders.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400">ยังไม่มีประวัติออเดอร์</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

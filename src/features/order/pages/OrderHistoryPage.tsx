// src/features/order/pages/OrderHistoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChefHat, CheckCircle, XCircle, ShoppingBag, RefreshCw, ArrowLeft, ArrowRight, AlertCircle, CalendarDays } from 'lucide-react';
import { useAuthStore } from '../../../stores/use-auth-store';
import { getOrders } from '../../shop/api/shopService';
import { useToastStore } from '../../../stores/useToastStore'; // ✅ Import

interface Order {
  order_id: number;
  menu_id: number;
  menu_name?: string; 
  quantity: number;
  total_price: number | string; // ✅ รองรับ String จาก API ("1750.00")
  order_status: string;
  order_date: string;
  restaurant_id: number;
  customer_id?: number; // ✅ ปรับเป็น Optional เพราะ API บางทีก็ลืมส่งมา
  customer_name?: string; // ✅ เพิ่ม field นี้ตาม JSON ที่เห็น
  image_url?: string;  // ✅ เพิ่มเผื่อมีรูป
}

export const OrderHistoryPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToastStore(); // ✅ ใช้ Toast

  // ✅ Helper: ดึงเดือนปัจจุบัน (YYYY-MM)
  const getCurrentMonthString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // ✅ State สำหรับเลือกเดือน (ค่าเริ่มต้น = เดือนปัจจุบัน)
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString(new Date()));

  // Auto Refresh ทุก 5 วินาที
  useEffect(() => {
    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchMyOrders = async () => {
    if (!user) return;
    try {
      // setError(null); // ไม่ต้องเคลียร์ Error ทุกรอบ เดี๋ยวจอกระพริบ
      
      // 1. ดึงข้อมูลดิบ
      const response = await getOrders();
      
      // 2. เช็คว่าเป็น Array จริงไหม (กันจอขาวถ้า API ส่ง Error Object มา)
      const allOrders = Array.isArray(response) ? response : [];

      // 3. กรองเอาเฉพาะของฉัน (User นี้) และเรียงลำดับใหม่สุดขึ้นก่อน
      const myOrders = allOrders
        .filter((o: any) => {
            // ✅ วิธีที่ 1: เช็คด้วย ID (แม่นยำที่สุด) ถ้า API ส่งมา
            if (o.customer_id && user.id) {
                return String(o.customer_id) === String(user.id);
            }
            // ⚠️ วิธีที่ 2 (สำรอง): ถ้า Backend ลืมส่ง ID มา ให้เทียบด้วยชื่อแทน (แก้ขัด)
            if (o.customer_name && (user.username || user.name)) {
                return o.customer_name === user.username || o.customer_name === user.name;
            }
            return false;
        })
        .sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
      
      setOrders(myOrders);
      setIsLoading(false); // โหลดเสร็จแล้ว
    } catch (err) {
      console.error("Error fetching history:", err);
      // แสดง Error เฉพาะตอนที่ยังไม่มีข้อมูลเลย (จะได้ไม่รบกวนตอน Auto Refresh)
      if (orders.length === 0) {
        setError("ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้");
        addToast("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error"); // 🔔 แจ้งเตือน
      }
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock, text: 'รอคิวปรุง' };
      case 'cooking': return { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: ChefHat, text: 'กำลังปรุง' };
      case 'completed': return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle, text: 'เสร็จแล้ว' };
      case 'cancelled': return { color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle, text: 'ยกเลิก' };
      case 'paid': return { color: 'bg-purple-50 text-purple-600 border-purple-100', icon: CheckCircle, text: 'ชำระเงินแล้ว' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: Clock, text: status || 'Unknown' };
    }
  };

  // ✅ กรองออเดอร์ตาม "เดือน" ที่เลือก
  const filteredOrders = orders.filter(order => {
    if (!order.order_date) return false;
    const orderDate = new Date(order.order_date);
    const orderMonth = getCurrentMonthString(orderDate);
    return orderMonth === selectedMonth;
  });

  // 🗓️ ฟังก์ชันจัดกลุ่มออเดอร์ตามวัน
  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const date = new Date(order.order_date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let key = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    if (date.toDateString() === today.toDateString()) key = "วันนี้";
    else if (date.toDateString() === yesterday.toDateString()) key = "เมื่อวาน";

    if (!groups[key]) groups[key] = [];
    groups[key].push(order);
    return groups;
  }, {} as Record<string, Order[]>);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="text-gray-500">กำลังโหลดประวัติการสั่งซื้อ...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-lg shadow-blue-900/5 border border-white/50 sticky top-24 md:top-28 z-30 transition-all gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full md:hidden">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3 tracking-tight">
            <span className="bg-gradient-to-br from-blue-100 to-blue-50 p-2.5 rounded-2xl shadow-inner"><Clock className="w-6 h-6 text-blue-900" /></span> ประวัติการสั่งซื้อ
          </h1>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
            {/* 📅 Month Picker: ตัวเลือกเดือน */}
            <div className="relative">
                <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                />
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <button onClick={() => { setIsLoading(true); fetchMyOrders(); }} className="p-2 hover:bg-gray-100 rounded-full transition-transform hover:rotate-180 bg-white border border-gray-100 shadow-sm">
                <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
        </div>
      )}

      {/* ปุ่ม Refresh กรณีข้อมูลไม่ขึ้น */}
      {orders.length === 0 && !isLoading && !error && (
        <div className="text-center mt-4">
            <button onClick={fetchMyOrders} className="text-sm text-blue-600 underline">ลองโหลดข้อมูลใหม่</button>
        </div>
      )}

      {!error && orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">ยังไม่มีรายการสั่งซื้อ</h3>
          <p className="text-gray-500 mb-6">หิวหรือยัง? สั่งอาหารอร่อยๆ กันเถอะ</p>
          <button onClick={() => navigate('/shops')} className="px-6 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
            ไปเลือกร้านอาหาร
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* กรณีไม่มีออเดอร์ในเดือนที่เลือก */}
          {filteredOrders.length === 0 && (
             <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500">ไม่พบรายการสั่งซื้อในเดือนนี้</p>
             </div>
          )}

          {Object.entries(groupedOrders).map(([date, dateOrders]) => (
            <div key={date} className="relative">
              {/* Sticky Date Header */}
              <div className="sticky top-48 z-20 flex items-center gap-4 mb-6">
                <div className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> {date}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
              </div>

              <div className="space-y-4 pl-2 md:pl-4 border-l-2 border-dashed border-gray-200 ml-4 md:ml-0">
                {dateOrders.map((order) => {
                  const status = getStatusBadge(order.order_status);
                  const StatusIcon = status.icon;

                  return (
              <div key={order.order_id} className="relative bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 group">
                {/* Timeline Dot */}
                <div className="absolute top-8 -left-[25px] md:-left-[33px] w-4 h-4 rounded-full bg-white border-4 border-blue-100 shadow-sm z-10">
                    <div className="w-full h-full rounded-full bg-blue-900"></div>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    {/* รูปภาพเมนู (ถ้ามี) */}
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        <img 
                            src={order.image_url || "https://placehold.co/100"} 
                            alt={order.menu_name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded-lg uppercase">Order #{order.order_id}</span>
                        <h3 className="font-bold text-xl text-gray-800 mt-2 group-hover:text-blue-900 transition-colors line-clamp-1">
                        {order.menu_name || `เมนูรหัส ${order.menu_id}`} 
                        <span className="text-sm font-normal text-gray-500 ml-2">x{order.quantity}</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.order_date).toLocaleString('th-TH')}
                        </p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold border ${status.color} shrink-0`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{status.text}</span>
                  </div>
                </div>

                {/* Timeline Progress Bar สุดเท่ */}
                {['pending', 'cooking', 'completed', 'paid'].includes(order.order_status) && (
                  <div className="relative pt-6 pb-2 px-1">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out
                          ${['completed', 'paid'].includes(order.order_status) ? 'bg-emerald-500 w-full shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                            order.order_status === 'cooking' ? 'bg-blue-500 w-2/3 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 
                            'bg-amber-400 w-1/3 shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} 
                      />
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                      <span className={`w-1/3 text-left ${['pending', 'cooking', 'completed', 'paid'].includes(order.order_status) ? 'text-amber-600 font-bold' : ''}`}>รับออเดอร์</span>
                      <span className={`w-1/3 text-center ${['cooking', 'completed', 'paid'].includes(order.order_status) ? 'text-blue-600 font-bold' : ''}`}>กำลังปรุง</span>
                      <span className={`w-1/3 text-right ${['completed', 'paid'].includes(order.order_status) ? 'text-emerald-600 font-bold' : ''}`}>เสร็จสิ้น</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                  <div className="text-xl font-black text-gray-800">
                    ฿{Number(order.total_price).toLocaleString()}
                  </div>
                  
                  {/* ✅ แก้ไข: ให้ปุ่มชำระเงินแสดงตั้งแต่ตอนสั่ง (Pending) เลย */}
                  {/* แสดงเมื่อสถานะไม่ใช่ 'paid' (จ่ายแล้ว) และไม่ใช่ 'cancelled' (ยกเลิก) */}
                  {['pending', 'cooking', 'completed'].includes(order.order_status) && (
                     <button 
                       onClick={() => navigate(`/payment/${order.order_id}`)} 
                       className="text-xs px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                     >
                       ชำระเงิน <ArrowRight className="w-3 h-3" />
                     </button>
                  )}

                  {order.order_status === 'paid' && (
                     <button 
                       onClick={() => navigate('/shops')} 
                       className="text-xs px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-bold flex items-center gap-2 transition-all"
                     >
                       สั่งเพิ่ม <ArrowRight className="w-3 h-3" />
                     </button>
                  )}
                </div>
              </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
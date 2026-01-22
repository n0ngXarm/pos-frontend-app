// src/features/admin/pages/AdminOrderPage.tsx
import { useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle, ChefHat, X, Bell, RefreshCw } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../../shop/api/shopService';

interface Order {
  order_id: number;
  customer_id: number;
  menu_id: number;
  quantity: number;
  total_price: number;
  order_status: string;
  order_date: string;
  menu_name?: string; 
  customer_name?: string;
}

export const AdminOrderPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref สำหรับจำจำนวนออเดอร์เก่า ไว้เทียบว่ามีของใหม่มามั้ย
  const prevOrderCountRef = useRef(0);
  
  // เสียงเตือน (ใช้ไฟล์เสียงฟรีจากเน็ต หรือเปลี่ยนเป็นไฟล์ในเครื่องได้)
  const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  useEffect(() => {
    fetchOrders();
    // ยิง API ทุก 5 วินาที (Polling)
    const interval = setInterval(fetchOrders, 5000); 
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      
      // 👇 1. แอบดูข้อมูลดิบที่ Backend ส่งมา (เปิด F12 ดู Console)
      console.log("📦 Data จาก Backend:", data);

      // 👇 2. กรองแบบยืดหยุ่นขึ้น (แก้ตรงนี้!)
      // แปลงเป็นตัวเล็กก่อนเทียบ และป้องกันค่า null/undefined
      const activeOrders = data.filter((o: Order) => {
        const status = o.order_status?.toLowerCase() || ''; // แปลงเป็นตัวเล็ก
        return ['pending', 'cooking', 'waiting'].includes(status); // เผื่อคำว่า waiting ด้วย
      }).sort((a: Order, b: Order) => b.order_id - a.order_id); // เอาอันใหม่ขึ้นก่อน (เรียง ID มาก -> น้อย)

      // เช็คว่ามีออเดอร์งอกใหม่มั้ย? ถ้ามีให้ "ติ๊ง!"
      if (activeOrders.length > prevOrderCountRef.current) {
        playSound();
      }
      prevOrderCountRef.current = activeOrders.length;

      setOrders(activeOrders);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playSound = () => {
    alertSound.play().catch(err => console.log("Browser block sound:", err));
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // อัปเดต state ทันทีเพื่อให้ UI ลื่น
      setOrders(prev => {
        if (newStatus === 'completed' || newStatus === 'cancelled') {
          // ถ้าเสร็จแล้ว ลบออกจากหน้าจอไปเลย จะได้ไม่รก
          return prev.filter(o => o.order_id !== orderId);
        }
        return prev.map(o => o.order_id === orderId ? { ...o, order_status: newStatus } : o);
      });
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };


  
  if (isLoading) return <div className="p-8 text-center text-2xl animate-pulse">กำลังเชื่อมต่อระบบครัว...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            👨‍🍳 ครัว (Kitchen)
            <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchOrders()} className="p-2 hover:bg-gray-100 rounded-full">
            <RefreshCw className="w-5 h-5 text-slate-500" />
          </button>
          <button onClick={playSound} className="p-2 hover:bg-gray-100 rounded-full">
            <Bell className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Grid Layout: ปรับให้ Responsive มากขึ้น */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order) => (
          <div 
            key={order.order_id} 
            className={`
              relative flex flex-col rounded-xl border-l-4 shadow-sm overflow-hidden bg-white transition-all hover:shadow-md
              ${order.order_status === 'cooking' ? 'border-blue-500 ring-1 ring-blue-100' : 'border-amber-400'}
            `}
          >
            {/* Header: เล็กลงหน่อย */}
            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs font-mono font-bold">
                  #{order.order_id}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(order.order_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`
                text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                ${order.order_status === 'cooking' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}
              `}>
                {order.order_status === 'cooking' ? 'Cooking...' : 'Waiting'}
              </div>
            </div>

            {/* Content: ปรับขนาดตัวอักษรให้พอดีตา */}
            <div className="p-4 flex-1 flex flex-col items-center justify-center text-center gap-1">
              <h3 className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight">
                {order.menu_name || `Menu ${order.menu_id}`}
              </h3>
              
              {/* ปริมาณ: ลดจาก 5xl เหลือ 3xl-4xl */}
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900">x{order.quantity}</span>
                <span className="text-sm text-slate-400 font-medium">ที่</span>
              </div>
            </div>

            {/* Actions: ปุ่ม Compact ขึ้น */}
            <div className="grid grid-cols-2 border-t border-gray-100 divide-x divide-gray-100">
              {order.order_status === 'pending' ? (
                <>
                  <button 
                    onClick={() => handleStatusChange(order.order_id, 'cancelled')}
                    className="py-3 bg-white hover:bg-red-50 text-red-500 text-sm font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <X className="w-4 h-4" /> ยกเลิก
                  </button>
                  <button 
                    onClick={() => handleStatusChange(order.order_id, 'cooking')}
                    className="py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <ChefHat className="w-4 h-4" /> ปรุง
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleStatusChange(order.order_id, 'completed')}
                  className="col-span-2 py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" /> เสร็จสิ้น
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <ChefHat className="w-16 h-16 mb-2 opacity-20" />
          <p className="font-medium">No active orders</p>
        </div>
      )}
    </div>
  );
};
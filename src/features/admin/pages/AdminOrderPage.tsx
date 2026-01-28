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
    <div className="space-y-6 pb-20 bg-[#0B1120] min-h-screen -m-4 md:-m-6 p-4 md:p-6 text-slate-100 font-mono">
      <div className="flex justify-between items-center bg-[#0B1120]/90 backdrop-blur-md p-4 border-b border-slate-800 sticky top-0 z-20">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-amber-500 flex items-center gap-2 tracking-wider uppercase">
            KDS SYSTEM v2.0
            <span className="text-[10px] font-bold bg-green-900/30 text-green-400 border border-green-900/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchOrders()} className="p-2 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800">
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
          <button onClick={playSound} className="p-2 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800">
            <Bell className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Grid Layout: ปรับให้ Responsive มากขึ้น */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order) => (
          <div 
            key={order.order_id} 
            className={`
              relative flex flex-col rounded-xl border bg-slate-900 shadow-xl overflow-hidden transition-all
              ${order.order_status === 'cooking' ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-amber-900/10' : 'border-slate-800 opacity-90 hover:opacity-100'}
            `}
          >
            {/* Header: เล็กลงหน่อย */}
            <div className={`px-4 py-3 border-b flex justify-between items-center ${order.order_status === 'cooking' ? 'bg-amber-900/10 border-amber-900/30' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">
                  #{order.order_id}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(order.order_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`
                text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md
                ${order.order_status === 'cooking' ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}
              `}>
                {order.order_status === 'cooking' ? 'Cooking...' : 'Waiting'}
              </div>
            </div>

            {/* Content: ปรับขนาดตัวอักษรให้พอดีตา */}
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4">
              <h3 className="text-xl font-bold text-slate-200 line-clamp-2 leading-snug">
                {order.menu_name || `Menu ${order.menu_id}`}
              </h3>
              
              {/* ปริมาณ: ลดจาก 5xl เหลือ 3xl-4xl */}
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-6xl font-black tracking-tighter ${order.order_status === 'cooking' ? 'text-amber-500 drop-shadow-lg' : 'text-slate-700'}`}>
                    {order.quantity}
                </span>
              </div>
            </div>

            {/* Actions: ปุ่ม Compact ขึ้น */}
            <div className="grid grid-cols-2 border-t border-slate-800 divide-x divide-slate-800 bg-slate-950">
              {order.order_status === 'pending' ? (
                <>
                  <button 
                    onClick={() => handleStatusChange(order.order_id, 'cancelled')}
                    className="py-4 hover:bg-red-900/20 text-red-500 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleStatusChange(order.order_id, 'cooking')}
                    className="py-4 hover:bg-amber-900/20 text-amber-500 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Cook
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleStatusChange(order.order_id, 'completed')}
                  className="col-span-2 py-4 bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Complete Order
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50">
          <ChefHat className="w-16 h-16 mb-2 opacity-20" />
          <p className="font-medium">No active orders</p>
        </div>
      )}
    </div>
  );
};
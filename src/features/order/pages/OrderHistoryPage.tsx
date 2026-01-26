// src/features/order/pages/OrderHistoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChefHat, CheckCircle, XCircle, ShoppingBag, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../stores/use-auth-store';
import { getOrders } from '../../shop/api/shopService';

interface Order {
  order_id: number;
  menu_id: number;
  menu_name?: string; 
  quantity: number;
  total_price: number;
  order_status: string;
  order_date: string;
  restaurant_id: number;
}

export const OrderHistoryPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auto Refresh ทุก 5 วินาที
  useEffect(() => {
    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchMyOrders = async () => {
    if (!user) return;
    try {
      // ดึงออเดอร์ทั้งหมด แล้วกรองเอาเฉพาะของฉัน (User นี้)
      const allOrders = await getOrders();
      const myOrders = allOrders
        .filter((o: any) => Number(o.customer_id) === Number(user.id))
        .sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
      
      setOrders(myOrders);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock, text: 'รอคิวปรุง' };
      case 'cooking': return { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: ChefHat, text: 'กำลังปรุง' };
      case 'completed': return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle, text: 'เสร็จแล้ว' };
      case 'cancelled': return { color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle, text: 'ยกเลิก' };
      case 'awaiting_payment': return { color: 'bg-orange-50 text-orange-600 border-orange-100', icon: Clock, text: 'รอชำระเงิน' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: Clock, text: status };
    }
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse">กำลังโหลดประวัติ...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 p-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-lg p-6 rounded-3xl shadow-sm border border-white/50 sticky top-24 md:top-28 z-30 transition-all">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full md:hidden">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3">
            <span className="bg-blue-100 p-2 rounded-xl"><Clock className="w-6 h-6 text-blue-900" /></span> ประวัติการสั่งซื้อ
          </h1>
        </div>
        <button onClick={fetchMyOrders} className="p-2 hover:bg-gray-100 rounded-full transition-transform hover:rotate-180">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {orders.length === 0 ? (
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
        <div className="space-y-4">
          {orders.map((order) => {
            const status = getStatusBadge(order.order_status);
            const StatusIcon = status.icon;

            return (
              <div key={order.order_id} className="bg-white p-6 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded-lg uppercase">Order #{order.order_id}</span>
                    <h3 className="font-bold text-xl text-gray-800 mt-2 group-hover:text-blue-900 transition-colors">
                      {order.menu_name || `เมนูรหัส ${order.menu_id}`} 
                      <span className="text-sm font-normal text-gray-500 ml-2">x{order.quantity}</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.order_date).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold border ${status.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {status.text}
                  </div>
                </div>

                {/* Timeline Progress Bar สุดเท่ */}
                {['pending', 'cooking', 'completed'].includes(order.order_status) && (
                  <div className="relative pt-6 pb-2 px-1">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out
                          ${order.order_status === 'completed' ? 'bg-blue-900 w-full shadow-[0_0_10px_rgba(30,58,138,0.5)]' : 
                            order.order_status === 'cooking' ? 'bg-amber-500 w-2/3 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 
                            'bg-gray-400 w-1/3 shadow-[0_0_10px_rgba(156,163,175,0.5)]'}`} 
                      />
                    </div>
                    {/* จุด Timeline */}
                    <div className="absolute top-4 left-0 w-full flex justify-between px-[10%] md:px-[16%]">
                       <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${['pending', 'cooking', 'completed'].includes(order.order_status) ? 'bg-gray-400 ring-2 ring-gray-200' : 'bg-gray-200'} -ml-1.5`}></div>
                       <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${['cooking', 'completed'].includes(order.order_status) ? 'bg-amber-500 ring-2 ring-amber-100' : 'bg-gray-200'} -ml-1.5`}></div>
                       <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${order.order_status === 'completed' ? 'bg-blue-900 ring-2 ring-blue-100' : 'bg-gray-200'} -ml-1.5`}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                      <span className={`w-1/3 text-center ${['pending', 'cooking', 'completed'].includes(order.order_status) ? 'text-gray-600 font-bold' : ''}`}>รับออเดอร์</span>
                      <span className={`w-1/3 text-center ${['cooking', 'completed'].includes(order.order_status) ? 'text-amber-600 font-bold' : ''}`}>กำลังปรุง</span>
                      <span className={`w-1/3 text-center ${order.order_status === 'completed' ? 'text-blue-900 font-bold' : ''}`}>พร้อมทาน</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                  <div className="text-xl font-black text-gray-800">
                    ฿{Number(order.total_price).toLocaleString()}
                  </div>
                  {order.order_status === 'completed' && (
                     <button 
                       onClick={() => navigate('/shops')} 
                       className="text-xs px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold flex items-center gap-2 transition-all shadow-lg shadow-gray-200"
                     >
                       สั่งอีกครั้ง <ArrowRight className="w-3 h-3" />
                     </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
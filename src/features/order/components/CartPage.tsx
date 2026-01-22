// src/features/order/components/CartPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, Loader2, CreditCard, Banknote, QrCode } from 'lucide-react';
import { useCartStore } from '../../../stores/useCartStore';
import { useAuthStore } from '../../../stores/use-auth-store';
import { createOrder } from '../../shop/api/shopService';
import { PaymentModal } from './PaymentDialog'; // Import Modal ใหม่

export const CartPage = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cash'>('qr');
  
  // State สำหรับ Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdOrderIds, setCreatedOrderIds] = useState<number[]>([]);

  // ฟังก์ชันหลัก: สร้างออเดอร์ลง Database ก่อนเลย
  const handlePlaceOrder = async () => {
    if (!user) return alert('กรุณาเข้าสู่ระบบ');
    setIsSubmitting(true);

    try {
      // 1. กำหนดสถานะเริ่มต้น
      // - QR: awaiting_payment (ครัวไม่เห็น)
      // - Cash: pending (ครัวเห็นเลย)
      const initialStatus = paymentMethod === 'qr' ? 'awaiting_payment' : 'pending';

      // 2. ยิง API สร้างออเดอร์
      const orderPromises = items.map(item => {
        return createOrder({
          customer_id: Number(user?.id),
          restaurant_id: item.restaurant_id,
          menu_id: item.menu_id,
          quantity: item.quantity,
          total_price: Number(item.price) * item.quantity,
          order_status: initialStatus, 
          order_date: new Date().toISOString()
        });
      });

      const responses = await Promise.all(orderPromises);
      const newOrderIds = responses.map((res: any) => res.order_id); // สมมติว่า Backend ส่ง order_id กลับมา
      
      // 3. แยกทางเดิน
      if (paymentMethod === 'qr') {
        // ถ้า QR: เปิด Modal นับถอยหลัง (ยังไม่ล้างตะกร้า เผื่อยกเลิก)
        setCreatedOrderIds(newOrderIds);
        setIsPaymentOpen(true);
      } else {
        // ถ้าเงินสด: จบเลย
        alert('🎉 สั่งอาหารเรียบร้อย! กรุณาชำระเงินที่เคาน์เตอร์');
        clearCart();
        navigate('/shops');
      }

    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการสร้างออเดอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback เมื่อจ่ายเงินผ่าน QR สำเร็จ
  const handleQRSuccess = () => {
    setIsPaymentOpen(false);
    alert('🎉 ชำระเงินเรียบร้อย! ออเดอร์ส่งเข้าครัวแล้ว');
    clearCart();
    navigate('/shops');
  };

  // Callback เมื่อ QR หมดเวลาหรือยกเลิก
  const handleQRCancel = () => {
    setIsPaymentOpen(false);
    // ไม่ต้องทำอะไรเพิ่ม เพราะใน Modal เรายิง API Cancel ไปแล้ว
    // อาจจะเคลียร์ตะกร้าหรือไม่ก็ได้ แล้วแต่ Design (ในที่นี้ไม่เคลียร์ ให้กดสั่งใหม่ได้)
  };

  if (items.length === 0) return <div className="text-center py-20">ตะกร้าว่างเปล่า...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header & List (เหมือนเดิม) */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
           <ArrowLeft className="w-6 h-6 text-slate-500" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">ยืนยันคำสั่งซื้อ</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ฝั่งซ้าย: รายการสินค้า (2 ส่วน) */}
        <div className="md:col-span-2 space-y-4">
           {/* ... (รายการสินค้า Loop เหมือนเดิม) ... */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             {items.map((item) => (
                <div key={item.menu_id} className="p-4 flex gap-4 border-b border-gray-50 last:border-0">
                  <img src={item.image_url || "https://placehold.co/100"} className="w-16 h-16 rounded object-cover bg-gray-100" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{item.menu_name}</h4>
                    <p className="text-sm text-slate-500">x{item.quantity}</p>
                  </div>
                  <div className="font-bold text-slate-700">
                    {(Number(item.price) * item.quantity).toLocaleString()} ฿
                  </div>
                </div>
             ))}
           </div>
        </div>

        {/* ฝั่งขวา: สรุปยอด & เลือกวิธีจ่าย (1 ส่วน) */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="font-bold text-lg mb-4">วิธีการชำระเงิน</h3>
            
            <div className="space-y-3 mb-6">
              <button 
                onClick={() => setPaymentMethod('qr')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${paymentMethod === 'qr' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:bg-gray-50'}`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white shrink-0">
                   <QrCode className="w-5 h-5" />
                </div>
                <div className="text-left">
                   <div className="font-bold text-sm">สแกนจ่าย (PromptPay)</div>
                   <div className="text-xs opacity-70">ยอดเข้าทันที / ฟรีค่าธรรมเนียม</div>
                </div>
                {paymentMethod === 'qr' && <div className="ml-auto w-4 h-4 rounded-full bg-orange-500" />}
              </button>

              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 hover:bg-gray-50'}`}
              >
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0">
                   <Banknote className="w-5 h-5" />
                </div>
                <div className="text-left">
                   <div className="font-bold text-sm">เงินสด (Cash)</div>
                   <div className="text-xs opacity-70">ชำระที่เคาน์เตอร์</div>
                </div>
                {paymentMethod === 'cash' && <div className="ml-auto w-4 h-4 rounded-full bg-green-500" />}
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-slate-500">ยอดรวมสินค้า</span>
                 <span>{getTotalPrice().toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-slate-900">
                 <span>ยอดสุทธิ</span>
                 <span className="text-orange-600">{getTotalPrice().toLocaleString()} ฿</span>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'สั่งซื้อสินค้า'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal (Countdown Timer) */}
      <PaymentModal 
        isOpen={isPaymentOpen}
        orderIds={createdOrderIds}
        totalAmount={getTotalPrice()}
        onSuccess={handleQRSuccess}
        onCancel={handleQRCancel}
      />
    </div>
  );
};
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../../../stores/useCartStore';
import { createOrder } from '../../shop/api/shopService';

export const CartPage = () => {
  const navigate = useNavigate();
  
  // ดึง State จาก Store
  // หมายเหตุ: ต้องตรวจสอบว่าใน useCartStore มี function updateQuantity และ removeItem แล้วหรือยัง
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity); 
  const clearCart = useCartStore((state) => state.clearCart);

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // คำนวณราคารวม
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      // เนื่องจาก API createOrder รับทีละรายการ เราจึงต้องวนลูปยิง
      // (ในระบบจริงควรมี API ที่รับเป็น Array ได้เลยเพื่อลด Request)
      const orderPromises = items.map((item) => 
        createOrder({
          customer_id: 1, // Mock ID ลูกค้า (ในอนาคตควรดึงจาก Auth Store)
          restaurant_id: item.restaurant_id,
          menu_id: item.menu_id,
          quantity: item.quantity,
          total_price: item.price * item.quantity,
          order_status: 'pending',
          order_date: new Date().toISOString(),
        })
      );

      await Promise.all(orderPromises);

      // สั่งเสร็จแล้วเคลียร์ตะกร้า
      clearCart();
      
      // แจ้งเตือนและย้ายหน้า
      alert('สั่งอาหารเรียบร้อยแล้ว! 🍜');
      // navigate('/orders'); // ถ้ามีหน้า Order History ให้เปิดบรรทัดนี้
      navigate('/shops'); // กลับไปหน้าร้านค้าก่อน
    } catch (error) {
      console.error("Checkout failed:", error);
      alert('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="bg-gray-100 p-6 rounded-full">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">ตะกร้าของคุณว่างเปล่า</h2>
        <p className="text-slate-500">หิวไหม? ไปเลือกร้านอาหารกันเถอะ</p>
        <button 
          onClick={() => navigate('/shops')}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          เลือกร้านอาหาร
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">ตะกร้าสินค้า ({items.length})</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* รายการสินค้า */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.menu_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
              <img 
                src={item.image_url || "https://placehold.co/100"} 
                alt={item.menu_name}
                className="w-24 h-24 rounded-lg object-cover bg-gray-50"
              />
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">{item.menu_name}</h3>
                  <p className="text-indigo-600 font-medium">{item.price.toLocaleString()} บาท</p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.menu_id, Math.max(1, item.quantity - 1))}
                      className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <span className="font-medium w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.menu_id, item.quantity + 1)}
                      className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeItem(item.menu_id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* สรุปยอด */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">สรุปรายการสั่งซื้อ</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>ยอดรวมสินค้า</span>
                <span>{totalPrice.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ค่าจัดส่ง</span>
                <span>0 บาท</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg text-slate-900">
                <span>ยอดสุทธิ</span>
                <span>{totalPrice.toLocaleString()} บาท</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                'กำลังดำเนินการ...'
              ) : (
                <>
                  ยืนยันการสั่งซื้อ <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
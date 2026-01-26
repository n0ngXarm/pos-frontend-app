import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../../../stores/useCartStore';
import { createOrder } from '../../shop/api/shopService';
import { useAuthStore } from '../../../stores/use-auth-store';

export const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // 👈 ดึง user มาใช้
  
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

    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ');
      navigate('/login');
      return;
    }

    setIsCheckingOut(true);
    try {
      // เนื่องจาก API createOrder รับทีละรายการ เราจึงต้องวนลูปยิง
      // (ในระบบจริงควรมี API ที่รับเป็น Array ได้เลยเพื่อลด Request)
      const orderPromises = items.map((item) => 
        createOrder({
          customer_id: Number(user.id), // 👈 ใช้ ID จริงแล้ว!
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
      navigate('/orders'); // ✅ แก้ไข: ต้องไปที่ /orders ตามที่ตั้งไว้ใน AppRoutes
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
        <h2 className="text-2xl font-bold text-gray-800">ตะกร้าของคุณว่างเปล่า</h2>
        <p className="text-gray-500">หิวไหม? ไปเลือกร้านอาหารกันเถอะ</p>
        <button 
          onClick={() => navigate('/shops')}
          className="mt-4 px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
        >
          เลือกร้านอาหาร
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-80 md:pb-32 px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-6">
        <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-gray-50 rounded-full shadow-sm transition-all">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">My Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* รายการสินค้า */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.menu_id} className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-200 flex gap-5 items-center hover:shadow-lg transition-all duration-300 group">
              <img 
                src={item.image_url || "https://placehold.co/100"} 
                alt={item.menu_name}
                className="w-24 h-24 rounded-2xl object-cover bg-gray-50 shadow-sm group-hover:scale-105 transition-transform duration-500"
              />
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-xl line-clamp-1 mb-1">{item.menu_name}</h3>
                  <p className="text-amber-600 font-black text-lg">{item.price.toLocaleString()} <span className="text-xs font-normal text-gray-400">THB</span></p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                    <button 
                      onClick={() => updateQuantity(item.menu_id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-blue-900 active:scale-90 transition-all"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="font-bold w-6 text-center text-gray-800">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.menu_id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-blue-900 active:scale-90 transition-all"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeItem(item.menu_id)}
                    className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-xl hover:bg-red-100 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* สรุปยอด (Desktop: Sticky Top, Mobile: Fixed Bottom) */}
        <div className="lg:col-span-1 fixed bottom-32 left-4 right-4 md:static md:bottom-auto md:left-auto md:right-auto p-4 md:p-0 bg-white/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-2xl md:rounded-none shadow-2xl md:shadow-none border border-white/50 md:border-none z-40 md:z-auto">
          <div className="md:bg-white lg:p-8 lg:rounded-[2rem] lg:shadow-[0_10px_40px_rgba(0,0,0,0.05)] lg:border lg:border-gray-100 relative overflow-hidden">
            {/* Decoration */}
            <div className="hidden lg:block absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8"></div>
            
            <h3 className="hidden lg:block text-xl font-black text-gray-800 mb-6">Order Summary</h3>
            
            <div className="space-y-3 mb-6 hidden lg:block">
              <div className="flex justify-between text-gray-600">
                <span>ยอดรวมสินค้า</span>
                <span>{totalPrice.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ค่าจัดส่ง</span>
                <span className="text-green-600 font-medium">ฟรี!</span>
              </div>
            </div>

            <div className="flex items-center justify-between lg:block">
                <div className="lg:border-t lg:border-dashed lg:border-gray-200 lg:pt-4 lg:mb-6">
                    <p className="text-sm text-gray-500 lg:hidden">Total</p>
                    <div className="flex justify-between font-black text-2xl text-gray-900">
                        <span className="hidden lg:inline">Total</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-gray-800">{totalPrice.toLocaleString()} ฿</span>
                    </div>
                </div>

                <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-1/2 lg:w-full bg-gradient-to-r from-blue-900 to-gray-800 text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isCheckingOut ? (
                    'Processing...'
                ) : (
                    <>
                    Checkout <ArrowRight className="w-5 h-5" />
                    </>
                )}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
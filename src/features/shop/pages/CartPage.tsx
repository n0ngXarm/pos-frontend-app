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
      navigate('/my-orders'); // 👈 เด้งไปหน้าประวัติการสั่งซื้อ เพื่อให้กดจ่ายเงินต่อ
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
    <div className="max-w-4xl mx-auto pb-32 px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-6">
        <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-gray-50 rounded-full shadow-sm transition-all">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* รายการสินค้า */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.menu_id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-center">
              <img 
                src={item.image_url || "https://placehold.co/100"} 
                alt={item.menu_name}
                className="w-20 h-20 rounded-2xl object-cover bg-gray-50"
              />
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{item.menu_name}</h3>
                  <p className="text-blue-700 font-bold text-sm">{item.price.toLocaleString()} ฿</p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                    <button 
                      onClick={() => updateQuantity(item.menu_id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-blue-600 active:scale-90 transition-all"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <span className="font-bold w-6 text-center text-slate-800">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.menu_id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-blue-600 active:scale-90 transition-all"
                    >
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeItem(item.menu_id)}
                    className="w-10 h-10 flex items-center justify-center bg-stone-100 text-stone-500 rounded-xl hover:bg-stone-200 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* สรุปยอด (Desktop: Sticky Top, Mobile: Fixed Bottom) */}
        <div className="lg:col-span-1 fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 lg:static lg:bg-transparent lg:border-none lg:p-0 z-30">
          <div className="bg-white lg:p-6 lg:rounded-3xl lg:shadow-xl lg:shadow-slate-200/50 lg:border lg:border-gray-100">
            
            <h3 className="hidden lg:block text-xl font-black text-slate-800 mb-6">Order Summary</h3>
            
            <div className="space-y-3 mb-6 hidden lg:block">
              <div className="flex justify-between text-slate-600">
                <span>ยอดรวมสินค้า</span>
                <span>{totalPrice.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ค่าจัดส่ง</span>
                <span className="text-green-600 font-medium">ฟรี!</span>
              </div>
            </div>

            <div className="flex items-center justify-between lg:block">
                <div className="lg:border-t lg:border-dashed lg:border-gray-200 lg:pt-4 lg:mb-6">
                    <p className="text-sm text-slate-500 lg:hidden">Total</p>
                    <div className="flex justify-between font-black text-2xl text-slate-900">
                        <span className="hidden lg:inline">Total</span>
                        <span className="text-amber-600">{totalPrice.toLocaleString()} ฿</span>
                    </div>
                </div>

                <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-1/2 lg:w-full bg-blue-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
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
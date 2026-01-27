import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, Banknote, QrCode, CreditCard, Upload, ShieldCheck, Lock, X } from 'lucide-react';
import { useCartStore } from '../../../stores/useCartStore';
import { createOrder, generatePromptPayQR } from '../api/shopService';
import { useAuthStore } from '../../../stores/use-auth-store';
import { useToastStore } from '../../../stores/useToastStore'; // ✅ เรียกใช้ Store ใหม่

export const CartPage = () => {
  const navigate = useNavigate();
  const { user, login, token, refreshToken } = useAuthStore(); // 👈 ดึง user และฟังก์ชัน login มาใช้เพื่ออัปเดตสถานะ
  
  // ดึง State จาก Store
  // หมายเหตุ: ต้องตรวจสอบว่าใน useCartStore มี function updateQuantity และ removeItem แล้วหรือยัง
  // ✅ แก้ไข: เช็คว่าเป็น Array จริงๆ ก่อนใช้ เพื่อกันจอขาวถ้าข้อมูลใน LocalStorage พัง
  const rawItems = useCartStore((state) => state.items);
  // 🛡️ กรองข้อมูลขยะทิ้ง: เอาเฉพาะ item ที่มีอยู่จริงและมี menu_id เท่านั้น
  const items = Array.isArray(rawItems) 
    ? rawItems.filter(item => item && typeof item === 'object' && item.menu_id) 
    : [];

  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity); 
  const clearCart = useCartStore((state) => state.clearCart);
  const { addToast } = useToastStore(); // ✅ ดึงฟังก์ชันแจ้งเตือนมาใช้

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // 💳 Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'promptpay' | 'credit'>('promptpay');
  const [slipImage, setSlipImage] = useState<string>('');
  const [showBindCard, setShowBindCard] = useState(false); // Modal ผูกบัตร
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const PROMPTPAY_ID = "173-1-41607-5"; // เลขบัญชีรับเงิน


  // คำนวณราคารวม
  const totalPrice = items.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 0)), 0);

  // ฟังก์ชันย่อรูปสลิป (Reuse)
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeImage(file);
      setSlipImage(resized);
    }
  };

  const handleBindCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // จำลองการตรวจสอบบัตรเครดิตและอัปเกรด User
    if (cardForm.number.length < 16 || cardForm.cvv.length < 3) {
        addToast('ข้อมูลบัตรไม่ถูกต้อง', 'error');
        return;
    }

    if (user && token) {
        // อัปเดต User Store ให้เป็น Plus Member
        const updatedUser = { ...user, is_plus_member: true, credit_card_last4: cardForm.number.slice(-4) };
        login(updatedUser, token, refreshToken || undefined);
        addToast('🎉 ผูกบัตรสำเร็จ! คุณเป็น User Plus แล้ว', 'success');
        setShowBindCard(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!user) {
      addToast('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ', 'error'); // 🔔 แจ้งเตือนสวยๆ
      navigate('/login');
      return;
    }

    // เช็คสลิปถ้าเลือกโอนจ่าย
    if (paymentMethod === 'promptpay' && !slipImage) {
      addToast('กรุณาแนบสลิปโอนเงินก่อนสั่งซื้อ', 'warning');
      return;
    }

    // เช็คสิทธิ์ผ่อนชำระ
    if (paymentMethod === 'credit' && !user?.is_plus_member) {
        addToast('กรุณาผูกบัตรเครดิตเพื่อเปิดใช้งาน User Plus ก่อน', 'warning');
        return;
    }

    setIsCheckingOut(true);
    try {
      // กำหนดสถานะออเดอร์ตามวิธีชำระเงิน
      let status = 'paid'; 
      if (paymentMethod === 'cash') status = 'pending_payment';
      if (paymentMethod === 'credit') status = 'credit_pending';

      // เนื่องจาก API createOrder รับทีละรายการ เราจึงต้องวนลูปยิง
      // (ในระบบจริงควรมี API ที่รับเป็น Array ได้เลยเพื่อลด Request)
      const orderPromises = items.map((item) => 
        createOrder({
          customer_id: Number(user.id) || 0, // 🛡️ กันไว้เผื่อแปลงไม่ได้
          restaurant_id: item.restaurant_id,
          menu_id: item.menu_id,
          quantity: item.quantity,
          total_price: Number(item.price || 0) * item.quantity, // 🛡️ กันราคาเป็น null/undefined
          order_status: status,
          order_date: new Date().toISOString(),
          payment_method: paymentMethod, // ✅ ส่งวิธีชำระเงินไปด้วย
          slip_url: paymentMethod === 'promptpay' ? slipImage : null // ✅ ส่งสลิปไปด้วย
        })
      );

      await Promise.all(orderPromises);

      // สั่งเสร็จแล้วเคลียร์ตะกร้า
      clearCart();
      
      // แจ้งเตือนและย้ายหน้า
      addToast('สั่งอาหารเรียบร้อยแล้ว! 🍜', 'success'); // 🔔 แจ้งเตือนสำเร็จ
      navigate('/orders'); // ✅ แก้ไข: ต้องไปที่ /orders ตามที่ตั้งไว้ใน AppRoutes
    } catch (error) {
      console.error("Checkout failed:", error);
      addToast('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่', 'error'); // 🔔 แจ้งเตือน Error
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
        <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-full shadow-sm transition-all">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">My Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* รายการสินค้า */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.menu_id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-6 items-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <img 
                src={item.image_url || "https://placehold.co/100"} 
                alt={item.menu_name || "Menu"}
                className="w-28 h-28 rounded-2xl object-cover bg-gray-50 shadow-md group-hover:scale-105 transition-transform duration-500"
              />
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-xl line-clamp-1 mb-1">{item.menu_name || "Unknown Menu"}</h3>
                  <p className="text-amber-600 font-black text-lg">{Number(item.price || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">THB</span></p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700 rounded-xl p-1">
                    <button 
                      onClick={() => updateQuantity(item.menu_id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg shadow-sm text-gray-600 dark:text-white hover:text-blue-900 active:scale-90 transition-all"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="font-bold w-6 text-center text-gray-800 dark:text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.menu_id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg shadow-sm text-gray-600 dark:text-white hover:text-blue-900 active:scale-90 transition-all"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeItem(item.menu_id)}
                    className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-400 rounded-xl hover:bg-red-100 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 💳 ส่วนเลือกวิธีการชำระเงิน (เพิ่มใหม่) */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-lg shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-slate-700 mt-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-900" /> วิธีการชำระเงิน
            </h3>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-4 ring-blue-100 shadow-lg' : 'border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 hover:shadow-md'}`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-xs font-bold">เงินสด</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('promptpay')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'promptpay' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-4 ring-blue-100 shadow-lg' : 'border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 hover:shadow-md'}`}
              >
                <QrCode className="w-6 h-6" />
                <span className="text-xs font-bold">สแกนจ่าย</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('credit')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'credit' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-4 ring-blue-100 shadow-lg' : 'border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 hover:shadow-md'}`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-bold">ผ่อนชำระ</span>
              </button>
            </div>

            {/* 📱 แสดง QR Code เมื่อเลือก PromptPay */}
            {paymentMethod === 'promptpay' && (
              <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl p-6 border border-gray-100 dark:border-slate-600 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                    <img 
                        src={generatePromptPayQR(PROMPTPAY_ID, totalPrice)} 
                        alt="QR Code" 
                        className="w-40 h-40 mix-blend-multiply mx-auto"
                    />
                    <p className="text-xs font-bold text-blue-900 mt-2">สแกนจ่าย ฿{totalPrice.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex-1 w-full">
                    <label className="block font-bold text-gray-700 dark:text-slate-200 text-sm mb-2">แนบหลักฐานการโอน (Slip)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden" 
                        id="cart-slip-upload"
                      />
                      <label 
                        htmlFor="cart-slip-upload"
                        className="block w-full p-4 border-2 border-dashed border-gray-300 dark:border-slate-500 rounded-xl text-center cursor-pointer hover:bg-white dark:hover:bg-slate-600 hover:border-blue-400 transition-all group bg-white dark:bg-slate-700"
                      >
                        {slipImage ? (
                          <div className="relative">
                              <img src={slipImage} className="h-32 mx-auto rounded-lg shadow-sm object-contain" />
                              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-sm">เปลี่ยนรูป</div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-400 dark:text-slate-400 py-4">
                            <Upload className="w-8 h-8 mb-2 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            <span className="text-sm">คลิกเพื่ออัปโหลดสลิป</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 💵 ข้อความสำหรับเงินสด */}
            {paymentMethod === 'cash' && (
               <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-4 rounded-xl border border-green-100 dark:border-green-900/50 flex items-center gap-3 animate-in fade-in">
                  <Banknote className="w-5 h-5" />
                  <p className="text-sm font-medium">กรุณาชำระเงินที่เคาน์เตอร์หลังจากกดสั่งซื้อ</p>
               </div>
            )}

            {/* 💳 ข้อความสำหรับผ่อนชำระ */}
            {paymentMethod === 'credit' && (
               <div className="space-y-4 animate-in fade-in">
                  {!user?.is_plus_member ? (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl text-center space-y-3">
                          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                              <Lock className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-amber-900 dark:text-amber-100">สิทธิพิเศษสำหรับ User Plus</h4>
                          <p className="text-sm text-amber-700 dark:text-amber-200">ผูกบัตรเครดิตเพื่อเปิดใช้งานระบบ "กินก่อน จ่ายทีหลัง" และรับสิทธิประโยชน์มากมาย</p>
                          <button 
                            onClick={() => setShowBindCard(true)}
                            className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors shadow-sm"
                          >
                            สมัคร User Plus / ผูกบัตร
                          </button>
                      </div>
                  ) : (
                      <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 p-4 rounded-xl border border-purple-100 dark:border-purple-900/50">
                          <div className="flex items-center gap-3 mb-2">
                             <CreditCard className="w-5 h-5" />
                             <p className="font-bold">ชำระด้วยบัตร •••• {user.credit_card_last4}</p>
                          </div>
                          <p className="text-sm opacity-80 pl-8 dark:text-purple-300">ยอดเงินจะถูกเรียกเก็บในรอบบิลถัดไป</p>
                          <div className="mt-3 pl-8 text-xs font-medium bg-white/50 dark:bg-black/20 p-2 rounded-lg inline-block">
                             📅 สรุปยอดจ่าย: ฿{(totalPrice / 3).toLocaleString()} / เดือน (ผ่อน 3 เดือน 0%)
                          </div>
                      </div>
                  )}
               </div>
            )}

          </div>
        </div>

        {/* สรุปยอด (Desktop: Sticky Top, Mobile: Fixed Bottom) */}
        <div className="lg:col-span-1 fixed bottom-32 left-4 right-4 md:static md:bottom-auto md:left-auto md:right-auto p-4 md:p-0 bg-white/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-2xl md:rounded-none shadow-2xl md:shadow-none border border-white/50 md:border-none z-40 md:z-auto">
          <div className="md:bg-white dark:md:bg-slate-800 lg:p-8 lg:rounded-[2.5rem] lg:shadow-2xl lg:shadow-blue-900/10 dark:shadow-black/50 lg:border lg:border-white/50 dark:border-slate-700 relative overflow-hidden">
            {/* Decoration */}
            <div className="hidden lg:block absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
            
            <h3 className="hidden lg:block text-xl font-black text-gray-800 dark:text-white mb-6">Order Summary</h3>
            
            <div className="space-y-3 mb-6 hidden lg:block">
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>ยอดรวมสินค้า</span>
                <span>{totalPrice.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>ค่าจัดส่ง</span>
                <span className="text-green-600 font-medium">ฟรี!</span>
              </div>
            </div>

            <div className="flex items-center justify-between lg:block">
                <div className="lg:border-t lg:border-dashed lg:border-gray-200 dark:border-slate-600 lg:pt-4 lg:mb-6">
                    <p className="text-sm text-gray-500 lg:hidden">Total</p>
                    <div className="flex justify-between font-black text-2xl text-gray-900 dark:text-white">
                        <span className="hidden lg:inline">Total</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-gray-800">{totalPrice.toLocaleString()} ฿</span>
                    </div>
                </div>

                <button
                onClick={handleCheckout}
                disabled={isCheckingOut || (paymentMethod === 'promptpay' && !slipImage) || (paymentMethod === 'credit' && !user?.is_plus_member)}
                className="w-1/2 lg:w-full bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-900/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isCheckingOut ? (
                    'Processing...'
                ) : (
                    <>
                    {paymentMethod === 'promptpay' ? 'ยืนยันการโอนเงิน' : 'ยืนยันการสั่งซื้อ'} 
                    <ArrowRight className="w-5 h-5" />
                    </>
                )}
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal ผูกบัตรเครดิต */}
      {showBindCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
                <button onClick={() => setShowBindCard(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
                
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">ผูกบัตรเครดิต</h3>
                    <p className="text-gray-500 text-sm">เพื่ออัปเกรดเป็น User Plus และใช้ระบบผ่อนชำระ</p>
                </div>

                <form onSubmit={handleBindCardSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">หมายเลขบัตร</label>
                        <input 
                            type="text" 
                            placeholder="0000 0000 0000 0000" 
                            maxLength={19}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            value={cardForm.number}
                            onChange={e => setCardForm({...cardForm, number: e.target.value})}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">วันหมดอายุ</label>
                            <input type="text" placeholder="MM/YY" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVV</label>
                            <input 
                                type="password" 
                                placeholder="123" 
                                maxLength={3}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center" 
                                value={cardForm.cvv}
                                onChange={e => setCardForm({...cardForm, cvv: e.target.value})}
                                required 
                            />
                        </div>
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> ยืนยันและผูกบัตร
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> ข้อมูลของคุณถูกเข้ารหัสด้วยมาตรฐานความปลอดภัยสูงสุด
                        </p>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
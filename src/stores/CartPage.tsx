import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, FileText, Upload, Wallet, Copy, AlertCircle } from 'lucide-react';
import { useCartStore } from './useCartStore';
import { useAuthStore } from './use-auth-store';
import { api } from '../lib/axios';

export const CartPage = () => {
  const navigate = useNavigate();
  const { items, increaseQuantity, decreaseQuantity, removeItem, clearCart } = useCartStore();
  const { user } = useAuthStore();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [slipImage, setSlipImage] = useState<string | null>(null);

  // คำนวณยอดรวม
  const total = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
        alert('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ');
        navigate('/login');
        return;
    }
    if (items.length === 0) return;

    if (!slipImage) {
        alert('กรุณาแนบสลิปการโอนเงินเพื่อยืนยันการสั่งซื้อ (ต้องตรงตามตัวอย่าง EX1, EX2, EX3)');
        return;
    }

    setIsCheckingOut(true);
    try {
        const restaurantId = items[0].restaurant_id; 
        
        const orderData = {
            customer_id: user.id,
            restaurant_id: restaurantId,
            items: items.map(item => ({
                menu_id: item.id,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes || ''
            })),
            total_price: total,
            slip_image: slipImage,
            status: 'PENDING',
            payment_method: 'TRANSFER'
        };

        await api.post('/orders', orderData);
        
        clearCart();
        alert('✅ สั่งซื้อสำเร็จ! ร้านค้าได้รับออเดอร์แล้ว');
        navigate('/orders');
    } catch (error) {
        console.error(error);
        alert('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
    } finally {
        setIsCheckingOut(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`คัดลอกเลขบัญชี ${text} แล้ว`);
  };

  if (items.length === 0) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-500">
            <div className="w-40 h-40 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-200/20 animate-pulse rounded-full"></div>
                <ShoppingBag className="w-20 h-20 text-blue-400 relative z-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">ตะกร้าสินค้าว่างเปล่า</h2>
            <p className="text-slate-500 mb-8 text-lg">ยังไม่มีสินค้าในตะกร้า ไปเลือกอาหารอร่อยๆ กันเถอะ!</p>
            <button 
                onClick={() => navigate('/shops')}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/30 hover:scale-105 transition-all flex items-center gap-3"
            >
                <ArrowRight className="w-6 h-6" /> เลือกร้านอาหาร
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-32 animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="relative mb-10 p-8 rounded-[2rem] overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-900/20">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 drop-shadow-md">ตะกร้าสินค้าของคุณ</h1>
                    <p className="text-blue-100 text-lg opacity-90">ตรวจสอบรายการอาหารและชำระเงิน</p>
                </div>
                <div className="text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[200px]">
                    <p className="text-sm text-blue-100 mb-1">ยอดรวมทั้งสิ้น</p>
                    <p className="text-4xl font-black tracking-tight">฿{total.toLocaleString()}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Items */}
            <div className="lg:col-span-7 space-y-5">
                {items.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-5 items-center">
                        <img src={item.image_url || 'https://placehold.co/150'} alt={item.name} className="w-24 h-24 rounded-2xl object-cover bg-slate-100" />
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{item.name}</h3>
                                <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="font-black text-xl text-blue-600">฿{Number(item.price).toLocaleString()}</p>
                                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
                                    <button onClick={() => decreaseQuantity(item.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm"><Minus className="w-4 h-4" /></button>
                                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => increaseQuantity(item.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Right Column: Payment */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-700 sticky top-24">
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Wallet className="w-5 h-5" /></div>
                        ชำระเงิน
                    </h3>

                    {/* Bank Info */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 mb-6 text-center">
                        <p className="font-bold text-slate-800 dark:text-white mb-2">สแกนจ่ายผ่าน QR Code</p>
                        <img src="/qrcode.png.jpg" alt="QR Code" className="w-44 h-44 mx-auto rounded-lg mb-4" />
                        
                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-600" onClick={() => copyToClipboard('173-1-41607-5')}>
                            <div className="text-left">
                                <p className="text-xs text-slate-500">ธนาคารกสิกรไทย (KBANK)</p>
                                <p className="font-mono font-bold text-lg text-blue-600">173-1-41607-5</p>
                            </div>
                            <Copy className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">ชื่อบัญชี: บริษัท สตรีท อีทส์ จำกัด</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">หลักฐานการโอนเงิน (Slip)</label>

                        <div className="relative">
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="slip-upload" />
                            <label htmlFor="slip-upload" className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${slipImage ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'}`}>
                                {slipImage ? (
                                    <img src={slipImage} alt="Slip" className="h-full w-full object-contain p-2" />
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <span className="text-sm font-bold text-slate-500">คลิกเพื่ออัปโหลดสลิป</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <button 
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isCheckingOut ? 'กำลังตรวจสอบ...' : 'ยืนยันการชำระเงิน'} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
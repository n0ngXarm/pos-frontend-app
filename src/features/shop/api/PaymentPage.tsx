import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, CreditCard, ShieldCheck, QrCode, Banknote } from 'lucide-react';
import { api } from '../../../lib/axios';
import { generatePromptPayQR } from './shopService';

export const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [slipImage, setSlipImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'promptpay' | 'credit'>('promptpay');

  // ✅ ใช้เลขบัญชีที่คุณต้องการเป็นหลัก
  const PROMPTPAY_ID = "173-1-41607-5"; 

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(res => setOrder(res.data));
  }, [orderId]);

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

  const handleSubmit = async () => {
    if (paymentMethod === 'promptpay' && !slipImage) return alert('กรุณาแนบสลิปโอนเงิน');
    
    setIsSubmitting(true);
    try {
      // กำหนดสถานะตามวิธีการชำระเงิน
      let status = 'paid'; 
      if (paymentMethod === 'cash') status = 'pending_payment'; // รอชำระหน้างาน
      if (paymentMethod === 'credit') status = 'credit_pending'; // รออนุมัติผ่อน/บันทึกยอด

      await api.patch(`/orders/${orderId}`, {
        order_status: status,
        payment_method: paymentMethod,
        slip_url: paymentMethod === 'promptpay' ? slipImage : null
      });

      const message = paymentMethod === 'credit' ? '✅ บันทึกยอดผ่อนชำระเรียบร้อย!' : '✅ บันทึกข้อมูลการชำระเงินเรียบร้อย!';
      alert(message);
      navigate('/orders');
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex flex-col justify-center pb-20">
      {/* Glass Card Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-black/50 border border-white/50 dark:border-slate-700 space-y-8 relative overflow-hidden">
        
        {/* Decorative Background Blobs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>

        <div className="flex items-center justify-between relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-black text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-900" /> Payment
          </h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        <div className="text-center space-y-1 relative z-10">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Amount</p>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-600">
            ฿{Number(order.total_price).toLocaleString()}
          </div>
        </div>

        {/* 💳 ตัวเลือกวิธีการชำระเงิน */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          <button 
            onClick={() => setPaymentMethod('cash')}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-200' : 'border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'}`}
          >
            <Banknote className="w-6 h-6" />
            <span className="text-xs font-bold">เงินสด</span>
          </button>
          <button 
            onClick={() => setPaymentMethod('promptpay')}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'promptpay' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-200' : 'border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'}`}
          >
            <QrCode className="w-6 h-6" />
            <span className="text-xs font-bold">สแกนจ่าย</span>
          </button>
          <button 
            onClick={() => setPaymentMethod('credit')}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'credit' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-200' : 'border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'}`}
          >
            <CreditCard className="w-6 h-6" />
            <span className="text-xs font-bold">ผ่อนชำระ</span>
          </button>
        </div>

        {/* 📱 1. ส่วนสแกนจ่าย QR Code (PromptPay) */}
        {paymentMethod === 'promptpay' && (
          <div className="relative group perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center shadow-xl relative z-10 transform transition-transform duration-500 group-hover:scale-[1.02]">
            
            {/* Scanning Animation Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan_3s_ease-in-out_infinite] z-20 pointer-events-none"></div>
            <style>{`
              @keyframes scan {
                0%, 100% { top: 10%; opacity: 0; }
                50% { top: 90%; opacity: 1; }
              }
            `}</style>

            <div className="flex items-center gap-2 mb-4 text-blue-900 font-bold">
                <QrCode className="w-5 h-5" /> สแกนจ่ายด้วย PromptPay
            </div>

            <img 
                src={generatePromptPayQR(PROMPTPAY_ID, order.total_price)} 
                alt="QR Code" 
                className="w-56 h-56 mb-4 mix-blend-multiply"
            />
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                <Banknote className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-bold text-gray-600 tracking-widest">{PROMPTPAY_ID}</p> 
            </div>
            <p className="text-xs text-gray-400 mt-2">ชื่อบัญชี: ร้านค้า POS System</p>
          </div>
        </div>
        )}

        {/* 💵 2. ส่วนจ่ายเงินสด (Cash) */}
        {paymentMethod === 'cash' && (
            <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-3xl p-8 flex flex-col items-center justify-center shadow-sm text-center relative z-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <Banknote className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">ชำระเงินสดที่เคาน์เตอร์</h3>
                <p className="text-gray-500 dark:text-slate-300 text-sm mt-2">กรุณาแจ้งหมายเลข Order <span className="font-bold text-gray-800 dark:text-white">#{orderId}</span><br/>กับพนักงานเพื่อชำระเงิน</p>
            </div>
        )}

        {/* 💳 3. ส่วนผ่อนชำระ (Credit/Pay Later) */}
        {paymentMethod === 'credit' && (
            <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-3xl p-8 flex flex-col items-center justify-center shadow-sm text-center relative z-10">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">กินก่อน จ่ายทีหลัง</h3>
                <p className="text-gray-500 dark:text-slate-300 text-sm mt-2">ยอดเงินจะถูกบันทึกในบัญชีเครดิตของคุณ<br/>สามารถผ่อนชำระได้ภายใน 30 วัน</p>
                <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg text-xs text-purple-700 dark:text-purple-200 font-medium">
                    วงเงินคงเหลือ: ฿5,000.00
                </div>
            </div>
        )}

        {/* ส่วนอัปโหลดสลิป (เฉพาะ PromptPay) */}
        {paymentMethod === 'promptpay' && (
        <div className="space-y-3">
          <label className="block font-bold text-gray-700 dark:text-slate-300 text-sm ml-1">แนบหลักฐานการโอน (Slip)</label>
          <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="hidden" 
              id="slip-upload"
            />
            <label 
              htmlFor="slip-upload"
              className="block w-full p-6 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-2xl text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-600 hover:border-blue-200 transition-all group"
            >
              {slipImage ? (
                <div className="relative">
                    <img src={slipImage} className="max-h-48 mx-auto rounded-xl shadow-md" />
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">เปลี่ยนรูป</div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400 dark:text-slate-400">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-slate-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-gray-500" />
                  </div>
                  <span className="text-sm">แตะเพื่ออัปโหลดสลิป</span>
                </div>
              )}
            </label>
          </div>
        </div>
        )}

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || (paymentMethod === 'promptpay' && !slipImage)}
          className="w-full py-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-900/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : (
            paymentMethod === 'cash' ? <><Banknote className="w-5 h-5" /> ยืนยันการชำระเงินสด</> :
            paymentMethod === 'credit' ? <><CreditCard className="w-5 h-5" /> ยืนยันการผ่อนชำระ</> :
            <><ShieldCheck className="w-5 h-5" /> ยืนยันการโอนเงิน</>
          )}
        </button>
      </div>
      
      <p className="text-center text-gray-400 text-xs mt-6 flex items-center justify-center gap-1">
        <ShieldCheck className="w-3 h-3" /> Secure Payment Gateway
      </p>
    </div>
  );
};
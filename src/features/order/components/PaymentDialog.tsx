// src/features/order/components/PaymentModal.tsx
import { useState, useEffect } from 'react';
import { X, Clock, Wallet, CheckCircle, AlertTriangle } from 'lucide-react';
import { generatePromptPayQR, updateOrderStatus } from '../../shop/api/shopService';

interface PaymentModalProps {
  isOpen: boolean;
  orderIds: number[];     // รับ ID ของออเดอร์ที่เพิ่งสร้าง
  totalAmount: number;
  onSuccess: () => void;  // จ่ายสำเร็จ
  onCancel: () => void;   // หมดเวลาหรือกดยกเลิก
}

export const PaymentModal = ({ isOpen, orderIds, totalAmount, onSuccess, onCancel }: PaymentModalProps) => {
  // ตั้งเวลา 5 นาที (300 วินาที)
  const [timeLeft, setTimeLeft] = useState(300); 
  const [isChecking, setIsChecking] = useState(false);

  // เลข PromptPay ของคุณ (ใส่เบอร์โทร หรือ เลขบัตรปชช. ตรงนี้)
  const PROMPTPAY_ID = "004999165622266"; // เปลี่ยนเป็นเบอร์จริงของคุณได้เลย เช่น 0812345678

  useEffect(() => {
    if (!isOpen) return;

    // เริ่มนับถอยหลัง
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout(); // หมดเวลา!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleTimeout = async () => {
    // วนลูปยกเลิกทุกออเดอร์
    await Promise.all(orderIds.map(id => updateOrderStatus(id, 'cancelled')));
    alert("หมดเวลาชำระเงิน! ออเดอร์ถูกยกเลิกอัตโนมัติ");
    onCancel();
  };

  const handleConfirmPayment = async () => {
    setIsChecking(true);
    // จำลองการเช็คยอดเงิน (ของจริงต้องมี Webhook จากธนาคาร แต่ตอนนี้เรากดมือไปก่อน)
    setTimeout(async () => {
      // อัปเดตสถานะเป็น "pending" (เข้าครัวได้!)
      await Promise.all(orderIds.map(id => updateOrderStatus(id, 'pending')));
      setIsChecking(false);
      onSuccess();
    }, 1500);
  };

  // แปลงวินาทีเป็น นาที:วินาที
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-center relative">
        
        {/* Header แถบสีส้ม (Shopee Style) */}
        <div className="bg-orange-500 p-4 text-white">
          <h2 className="font-bold text-lg flex items-center justify-center gap-2">
            <Wallet className="w-5 h-5" /> ชำระเงินภายในเวลาที่กำหนด
          </h2>
        </div>

        <div className="p-6 space-y-6">
          
          {/* ตัวนับถอยหลัง */}
          <div className="flex flex-col items-center gap-1 text-orange-600">
             <Clock className="w-8 h-8 animate-pulse" />
             <span className="text-3xl font-mono font-bold tracking-widest">
               {formatTime(timeLeft)}
             </span>
             <p className="text-xs text-gray-500">กรุณาชำระเงินก่อนหมดเวลา</p>
          </div>

          <hr className="border-gray-100" />

          {/* QR Code ของจริง! */}
          <div className="bg-white border-2 border-slate-100 rounded-xl p-4 shadow-inner inline-block">
             <img 
               src={generatePromptPayQR(PROMPTPAY_ID, totalAmount)} 
               alt="PromptPay QR" 
               className="w-48 h-48 object-contain mx-auto"
             />
             <p className="text-sm font-bold text-slate-700 mt-2">ยอดชำระ: ฿{totalAmount.toLocaleString()}</p>
             <p className="text-xs text-slate-400 mt-1">ชื่อ: นาย พิสิษฐ์พงษ์ บุญเรือง</p> 
          </div>

          {/* ปุ่ม Action */}
          <div className="space-y-3">
            <button 
              onClick={handleConfirmPayment}
              disabled={isChecking}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isChecking ? 'กำลังตรวจสอบ...' : 'ฉันโอนเงินแล้ว'}
            </button>
            
            <button 
              onClick={() => {
                if(confirm("ต้องการยกเลิกการชำระเงิน? ออเดอร์จะถูกยกเลิกทันที")) {
                   handleTimeout(); // ใช้ Logic เดียวกับหมดเวลา (ยกเลิกออเดอร์)
                }
              }}
              className="text-gray-400 text-sm hover:text-gray-600"
            >
              ยกเลิกรายการ
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
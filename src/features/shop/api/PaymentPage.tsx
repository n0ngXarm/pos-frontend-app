import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../../lib/axios';
import { generatePromptPayQR } from './shopService';

export const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [slipImage, setSlipImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!slipImage) return alert('กรุณาแนบสลิปโอนเงิน');
    
    setIsSubmitting(true);
    try {
      await api.patch(`/orders/${orderId}`, {
        order_status: 'paid',
        slip_url: slipImage
      });
      alert('✅ แจ้งชำระเงินเรียบร้อย!');
      navigate('/my-orders');
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-slate-50">
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">ชำระเงิน 💸</h1>
        </div>

        <div className="text-center space-y-2">
          <p className="text-slate-500">ยอดที่ต้องชำระ</p>
          <div className="text-4xl font-black text-indigo-600">
            ฿{order.total_price.toLocaleString()}
          </div>
        </div>

        {/* QR Code ของจริง (คำนวณ CRC16 ถูกต้อง) */}
        <div className="bg-white border-2 border-dashed border-indigo-100 rounded-xl p-4 flex flex-col items-center justify-center">
            <img 
                src={generatePromptPayQR(PROMPTPAY_ID, order.total_price)} 
                alt="QR Code" 
                className="w-48 h-48 mb-2 mix-blend-multiply"
            />
            <p className="text-xs text-slate-400">สแกนเพื่อจ่ายเงิน (PromptPay)</p>
            <p className="text-xs font-bold text-slate-600 mt-1">{PROMPTPAY_ID}</p>
        </div>

        <div className="space-y-3">
          <label className="block font-bold text-slate-700">แนบหลักฐานการโอน</label>
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
              className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {slipImage ? (
                <img src={slipImage} className="max-h-48 mx-auto rounded-lg" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Upload className="w-8 h-8 mb-2" />
                  <span>คลิกเพื่ออัปโหลดสลิป</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || !slipImage}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle /> ยืนยันการชำระเงิน</>}
        </button>
      </div>
    </div>
  );
};
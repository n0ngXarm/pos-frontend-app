import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, 
  Banknote, QrCode, CreditCard, Upload, ShieldCheck, Lock, X, 
  Copy, Loader2, CheckCircle2, Wallet, 
  ChevronRight, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../../stores/useCartStore';
import { createOrder, generatePromptPayQR } from '../api/shopService';
import { useAuthStore } from '../../../stores/use-auth-store';
import { useToastStore } from '../../../stores/useToastStore';

export const CartPage = () => {
  const navigate = useNavigate();
  const { user, login, token, refreshToken } = useAuthStore();
  const { items: rawItems, removeItem, updateQuantity, clearCart, addItem } = useCartStore();
  const { addToast } = useToastStore();
  
  // ✅ Local state for "Saved for later" items
  const [savedItems, setSavedItems] = useState<any[]>([]);

  const items = Array.isArray(rawItems)
    ? rawItems.filter(item => item && typeof item === 'object' && item.menu_id) : [];

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'promptpay' | 'credit'>('promptpay');
  const [slipImage, setSlipImage] = useState<string>('');
  const [showBindCard, setShowBindCard] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastOrderData, setLastOrderData] = useState<any>(null);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const PROMPTPAY_ID = "173-1-41607-5";
  const [orderRef] = useState(`REF-${Math.floor(100000 + Math.random() * 900000)}`); 
  const [isRefIdConfirmed, setIsRefIdConfirmed] = useState(false);

  const totalPrice = items.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 0)), 0);

  // --- Actions ---
  // --- Helpers ---
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeImage(file);
      setSlipImage(resized);
      setIsRefIdConfirmed(false);
    }
  };

  const verifySlip = (_base64: string): Promise<boolean> => {
    return new Promise((resolve) => {
        // Mock verification for UX demo
        setTimeout(() => {
            addToast('✅ รูปแบบสลิปถูกต้อง (รอร้านค้าตรวจสอบยอดเงิน)', 'success');
            resolve(true);
        }, 1500);
    });
  };

  const handleBindCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && token) {
        const updatedUser = { ...user, is_plus_member: true, credit_card_last4: cardForm.number.slice(-4) || '8888' };
        login(updatedUser, token, refreshToken || undefined);
        addToast('🎉 ผูกบัตรสำเร็จ! คุณเป็น User Plus แล้ว', 'success');
        setShowBindCard(false);
    }
  };

  const handleCheckoutClick = () => {
    if (items.length === 0) return;
    if (!user) {
      addToast('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ', 'error');
      navigate('/login');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleConfirmOrder = async () => {
    if (paymentMethod === 'promptpay') {
        if (!slipImage) {
            addToast('กรุณาแนบสลิปโอนเงิน', 'warning');
            return;
        }
        if (!isRefIdConfirmed) {
            addToast('กรุณายืนยันว่าระบุ Ref ID ในสลิปแล้ว', 'warning');
            return;
        }
        setIsVerifying(true);
        const isValid = await verifySlip(slipImage);
        setIsVerifying(false);
        if (!isValid) return;
    }

    if (paymentMethod === 'credit' && !user?.is_plus_member) {
        addToast('กรุณาผูกบัตรเครดิตเพื่อเปิดใช้งาน User Plus ก่อน', 'warning');
        return;
    }

    setIsCheckingOut(true);
    try {
      let status = 'pending_payment'; 
      if (paymentMethod === 'credit') status = 'credit_pending';

      const orderSnapshot = {
        items: [...items],
        total: totalPrice,
        date: new Date(),
        ref: orderRef,
        paymentMethod
      };

      const orderPromises = items.map((item) =>
        createOrder({
          customer_id: Number(user?.id) || 0,
          restaurant_id: item.restaurant_id,
          menu_id: item.menu_id,
          quantity: item.quantity,
          total_price: Number(item.price || 0) * item.quantity,
          order_status: status,
          order_date: new Date().toISOString(),
          payment_method: paymentMethod,
          slip_url: paymentMethod === 'promptpay' ? slipImage : null
        })
      );

      await Promise.all(orderPromises);
      clearCart();
      setLastOrderData(orderSnapshot);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      
    } catch (error) {
      console.error("Checkout failed:", error);
      addToast('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast(`คัดลอก ${text} แล้ว`, 'success');
  };

  // --- Empty State ---
  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-blue-100/50 rounded-full blur-2xl group-hover:blur-xl transition-all duration-500"></div>
            <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 relative z-10">
                <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">ตะกร้าของคุณว่างเปล่า</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
            ยังไม่มีรายการอาหารในตะกร้า ลองเลือกดูเมนูอร่อยๆ จากร้านค้าของเราดูสิ
        </p>
        <button
          onClick={() => navigate('/shops')}
          className="group relative px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
        >
          <span className="relative flex items-center gap-3">
             เลือกร้านอาหาร <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 relative bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        
        {/* Header: Progress Steps */}
        <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-4 overflow-x-auto">
                <span className="text-blue-600 dark:text-blue-400 font-bold">ตะกร้าสินค้า</span>
                <ChevronRight className="w-4 h-4" />
                <span>ชำระเงิน</span>
                <ChevronRight className="w-4 h-4" />
                <span>เสร็จสิ้น</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        รายการอาหาร
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 text-sm">
                        <ShieldCheck className="w-4 h-4 text-green-600" /> 
                        ปลอดภัย 100% • {items.length} รายการ
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* Cart Items List */}
                <div className="space-y-4">
                    <AnimatePresence mode='popLayout'>
                    {items.map((item) => (
                        <motion.div 
                            key={item.menu_id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="group relative bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex gap-4 md:gap-6 items-center">
                                {/* Image */}
                                <div className="relative w-20 h-20 md:w-28 md:h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                                    <img 
                                        src={item.image_url || "https://placehold.co/200"} 
                                        alt={item.menu_name} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between h-24 md:h-32">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{item.menu_name}</h3>
                                            <p className="text-base font-bold text-slate-900 dark:text-white">
                                                ฿{(Number(item.price) * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">฿{Number(item.price).toLocaleString()} / ชิ้น</p>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        {/* Quantity Stepper */}
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                                            <button 
                                                onClick={() => updateQuantity(item.menu_id, Math.max(1, item.quantity - 1))}
                                                className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 rounded-md shadow-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 active:scale-90 transition-all"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="font-bold w-8 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.menu_id, item.quantity + 1)}
                                                className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 rounded-md shadow-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 active:scale-90 transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => removeItem(item.menu_id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>

            </div>

            {/* Right Column: Order Summary (Sticky) */}
            <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                        {/* Decorative Gradient */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Order Summary</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Subtotal</span>
                                <span className="font-medium text-slate-900 dark:text-white">฿{totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Discount</span>
                                <span className="text-slate-400 font-medium">-</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Service Fee</span>
                                <span className="text-green-500 font-bold text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">FREE</span>
                            </div>
                            
                            {/* Divider */}
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-4"></div>
                            
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-lg text-slate-900 dark:text-white">Total</span>
                                <span className="font-black text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 drop-shadow-sm">
                                    ฿{totalPrice.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Desktop CTA */}
                        <button
                            onClick={handleCheckoutClick}
                            className="hidden md:flex w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-900/30 hover:shadow-slate-900/40 hover:scale-[1.02] active:scale-95 transition-all items-center justify-center gap-2 group"
                        >
                            Proceed to Checkout <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <Lock className="w-3 h-3" /> SSL Secured Payment
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40">
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-xs text-slate-500">ยอดรวม</p>
                <p className="text-xl font-bold text-blue-600 dark:text-white">฿{totalPrice.toLocaleString()}</p>
            </div>
            <button
                onClick={handleCheckoutClick}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                ชำระเงิน <ArrowRight className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-100 dark:border-slate-800 flex flex-col">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-amber-500" /> Payment
                    </h3>
                    <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Payment Method Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { id: 'promptpay', icon: QrCode, label: 'PromptPay', desc: 'Scan QR' },
                            { id: 'credit', icon: CreditCard, label: 'Credit Card', desc: '0% Installment' },
                            { id: 'cash', icon: Banknote, label: 'Cash', desc: 'Pay at Counter' }
                        ].map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id as any)}
                                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                                    paymentMethod === method.id 
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                                    : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
                                }`}
                            >
                                {paymentMethod === method.id && (
                                    <div className="absolute top-3 right-3 text-amber-500"><CheckCircle2 className="w-5 h-5" /></div>
                                )}
                                <method.icon className={`w-8 h-8 mb-3 ${paymentMethod === method.id ? 'text-amber-500' : 'text-slate-400'}`} />
                                <p className="font-bold text-slate-900 dark:text-white">{method.label}</p>
                                <p className="text-xs text-slate-500">{method.desc}</p>
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Content */}
                    <div className="min-h-[300px]">
                        {paymentMethod === 'promptpay' && (
                            <div className="flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                                    <img src={generatePromptPayQR(PROMPTPAY_ID, totalPrice)} alt="QR" className="w-48 h-48 mix-blend-multiply dark:mix-blend-normal rounded-lg" />
                                    <p className="font-mono font-bold text-lg mt-4 text-slate-700 dark:text-white">{PROMPTPAY_ID}</p>
                                    <p className="text-sm text-slate-500">KASIKORN BANK</p>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">Ref ID (Required)</p>
                                        <div className="flex justify-between items-center">
                                            <span className="font-mono text-xl font-black text-slate-800 dark:text-white">{orderRef}</span>
                                            <button onClick={() => copyToClipboard(orderRef)} className="text-amber-600 text-xs font-bold flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Put this ID in the transfer note.</p>
                                    </div>

                                    <div className="relative">
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="slip-upload-modal" />
                                        <label htmlFor="slip-upload-modal" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${slipImage ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50'}`}>
                                            {slipImage ? (
                                                <div className="text-green-600 flex flex-col items-center">
                                                    <CheckCircle2 className="w-8 h-8 mb-2" />
                                                    <span className="font-bold text-sm">Slip Attached</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                                    <span className="text-sm font-medium text-slate-600">Upload Slip</span>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    {slipImage && (
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input type="checkbox" checked={isRefIdConfirmed} onChange={e => setIsRefIdConfirmed(e.target.checked)} className="mt-1 w-4 h-4 text-amber-600 rounded" />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">I have included Ref ID <b>{orderRef}</b> in the slip note.</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'credit' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <div className="relative z-10">
                                        <h4 className="font-bold text-lg mb-1">User Plus Benefit</h4>
                                        <p className="text-slate-300 text-sm mb-4">0% Interest Installment Plan (3 Months)</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black">฿{(totalPrice / 3).toLocaleString()}</span>
                                            <span className="text-sm opacity-70">/ month</span>
                                        </div>
                                    </div>
                                </div>

                                {!user?.is_plus_member ? (
                                    <div className="text-center py-8">
                                        <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-600 font-medium mb-4">Please link your card to unlock this feature</p>
                                        <button onClick={() => setShowBindCard(true)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-lg hover:bg-slate-800">Link Card</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl">
                                        <div className="w-12 h-8 bg-slate-200 rounded flex items-center justify-center"><CreditCard className="w-5 h-5 text-slate-500" /></div>
                                        <div>
                                            <p className="font-bold text-slate-800">•••• •••• •••• {user.credit_card_last4}</p>
                                            <p className="text-xs text-green-600 font-medium">Active & Ready</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {paymentMethod === 'cash' && (
                            <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Banknote className="w-10 h-10 text-green-600" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pay at Counter</h4>
                                <p className="text-slate-500 max-w-xs mx-auto">Please proceed to the counter and show your order ID to the staff.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 sticky bottom-0 z-10">
                    <button onClick={() => setShowPaymentModal(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                    <button 
                        onClick={handleConfirmOrder}
                        disabled={isCheckingOut || isVerifying || (paymentMethod === 'promptpay' && (!slipImage || !isRefIdConfirmed)) || (paymentMethod === 'credit' && !user?.is_plus_member)}
                        className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Payment'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Bind Card Modal */}
      {showBindCard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800">
                <button onClick={() => setShowBindCard(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                </button>
                
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CreditCard className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Link Credit Card</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Upgrade to User Plus for exclusive benefits</p>
                </div>

                <form onSubmit={handleBindCardSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Card Number</label>
                        <input 
                            type="text" 
                            placeholder="0000 0000 0000 0000" 
                            maxLength={19}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                            value={cardForm.number}
                            onChange={e => setCardForm({...cardForm, number: e.target.value})}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Expiry</label>
                            <input type="text" placeholder="MM/YY" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">CVV</label>
                            <input 
                                type="password" 
                                placeholder="123" 
                                maxLength={3}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono" 
                                value={cardForm.cvv}
                                onChange={e => setCardForm({...cardForm, cvv: e.target.value})}
                                required 
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all mt-4 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Secure Link
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastOrderData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <div className="p-6 bg-green-600 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Payment Successful!</h3>
                        <p className="text-green-100 text-sm">Thank you for your order</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Amount</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white">฿{lastOrderData.total.toLocaleString()}</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-mono text-slate-500">
                                Ref: {lastOrderData.ref}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-700 py-4 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {lastOrderData.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">
                                    <span className="font-bold text-slate-900 dark:text-white">{item.quantity}x</span> {item.menu_name}
                                </span>
                                <span className="font-medium text-slate-900 dark:text-white">฿{(Number(item.price) * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Date</span>
                            <span>{lastOrderData.date.toLocaleString('th-TH')}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Payment Method</span>
                            <span className="uppercase font-bold">{lastOrderData.paymentMethod}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                            onClick={() => window.print()}
                            className="py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        <button 
                            onClick={() => {
                                setShowReceiptModal(false);
                                navigate('/orders');
                            }}
                            className="py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

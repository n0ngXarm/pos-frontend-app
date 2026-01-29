import { useState, useEffect } from 'react';
import { User, Save, Loader2, Camera, Shield, Lock, Trash2, AlertTriangle, Store, KeyRound, Sparkles, CheckCircle2, X, Crown, Wallet, TrendingUp, BarChart } from 'lucide-react';
import { useAuthStore } from './use-auth-store';
import { api } from '../lib/axios';
import { sha256 } from 'js-sha256';
import { useNavigate, useParams } from 'react-router-dom';

export const SettingsPage = () => {
  const { user: loggedInUser, login, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = loggedInUser?.role === 'ADMIN';
  const isEditingSelf = !paramUserId || String(loggedInUser?.id) === paramUserId;
  
  // Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gmail, setGmail] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  // Read-only state
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Spending Chart State
  const [spendingOrders, setSpendingOrders] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'1D' | '5D' | '1M' | '1Y' | '5Y'>('1M');

  // Determine which user to fetch/edit
  const targetUserId = isAdmin && paramUserId ? paramUserId : loggedInUser?.id;

  useEffect(() => {
    if (targetUserId) {
      const fetchUserData = async () => {
        setIsPageLoading(true);
        try {
          const { data: fullUserData } = await api.get(`/customers/${targetUserId}`);
          setUsername(fullUserData.username || '');
          setName(fullUserData.fullname || '');
          setLastname(fullUserData.lastname || '');
          setPhoneNumber(fullUserData.phone_number || '');
          setGmail(fullUserData.gmail || '');
          setAddress(fullUserData.address || '');
          setAvatar(fullUserData.image_url || '');
          setCreatedAt(fullUserData.created_at || '');
          setUpdatedAt(fullUserData.updated_at || '');

          if (isEditingSelf && loggedInUser) {
             if (fullUserData.is_plus_member !== loggedInUser.is_plus_member) {
                 const updatedUser = { ...loggedInUser, is_plus_member: fullUserData.is_plus_member };
                 login(updatedUser, token || '');
             }
          }

          // Fetch Orders for Spending History
          const { data: allOrders } = await api.get('/orders');
          if (Array.isArray(allOrders)) {
             const myOrders = allOrders.filter((o: any) => String(o.customer_id) === String(targetUserId) && ['paid', 'completed'].includes(o.order_status));
             setSpendingOrders(myOrders);
          }
        } catch (error) {
          console.error(`Failed to fetch user details for ID: ${targetUserId}`, error);
          alert('ไม่สามารถดึงข้อมูลผู้ใช้ได้ หรือผู้ใช้ไม่มีอยู่จริง');
          if (isAdmin && !isEditingSelf) {
            navigate('/admin/shops');
          }
        } finally {
          setIsPageLoading(false);
        }
      };
      fetchUserData();
    }
  }, [targetUserId, navigate, isAdmin, isEditingSelf]);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeImage(file);
      setAvatar(resized);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetUserId || !token) {
      alert('ไม่พบข้อมูลผู้ใช้ หรือ Session หมดอายุ กรุณาล็อกอินใหม่');
      return;
    }

    setIsSaving(true);
    try {
      // 1. ดึงข้อมูลล่าสุดก่อนเพื่อป้องกันข้อมูลหายเมื่อใช้ PUT
      const { data: currentData } = await api.get(`/customers/${targetUserId}`);

      // ⚠️ แก้ไข: แยก id ออกจาก payload เพื่อป้องกัน Error 500 (บาง Backend ไม่ชอบให้ส่ง id ไปใน body)
      const { id, ...restData } = currentData;

      const payload = {
        ...restData, // Merge ข้อมูลเดิม (ยกเว้น id)
        username: username,
        fullname: name,
        lastname: lastname,
        phone_number: phoneNumber,
        gmail: gmail,
        address: address,
        image_url: avatar,
        updated_at: new Date().toISOString(),
      };

      // 2. ใช้ PUT แทน PATCH เพื่อความชัวร์ (บาง Backend ไม่รองรับ PATCH)
      const { data: responseData } = await api.put(`/customers/${targetUserId}`, payload);

      if (isEditingSelf && loggedInUser) {
        // อัปเดตข้อมูลใน Store ทันทีเพื่อให้ UI ส่วนอื่น (เช่น Sidebar) เปลี่ยนตาม
        const updatedUser = { 
            ...loggedInUser, 
            username: responseData.username || username,
            fullname: responseData.fullname || name,
            name: responseData.fullname || name, // เผื่อไว้สำหรับ component ที่ใช้ field ต่างกัน
            image_url: responseData.image_url || avatar,
            avatar_url: responseData.image_url || avatar // เผื่อไว้สำหรับ component ที่ใช้ field ต่างกัน
        };
        login(updatedUser, token);
      }

      setUpdatedAt(responseData.updated_at);
      alert('✅ บันทึกข้อมูลเรียบร้อย');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;

    if (newPassword !== confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (newPassword.length < 4) {
      alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setIsPasswordLoading(true);
    try {
      // ดึงข้อมูลล่าสุดเสมอเพื่อความปลอดภัย
      const { data: currentUser } = await api.get(`/customers/${targetUserId}`);

      if (isEditingSelf) {
        const currentPasswordHash = sha256(currentPassword);
        
        if (currentUser.password !== currentPasswordHash) { 
           alert('รหัสผ่านเดิมไม่ถูกต้อง');
           setIsPasswordLoading(false);
           return;
        }
      }

      const newPasswordHash = sha256(newPassword);
      await api.put(`/customers/${targetUserId}`, {
        ...currentUser,
        password: newPasswordHash
      });

      alert('✅ เปลี่ยนรหัสผ่านเรียบร้อย');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!targetUserId) return;
    const confirmMessage = isEditingSelf
      ? '⚠️ คำเตือน: คุณแน่ใจหรือไม่ที่จะลบบัญชีของคุณ?\n\nข้อมูลประวัติการสั่งซื้อและการตั้งค่าทั้งหมดจะหายไปถาวร!'
      : `⚠️ คำเตือน: คุณแน่ใจหรือไม่ที่จะลบบัญชีผู้ใช้ ID: ${targetUserId}?\n\nการกระทำนี้ไม่สามารถกู้คืนได้`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    try {
      await api.delete(`/customers/${targetUserId}`);
      if (isEditingSelf) {
        logout();
        navigate('/login');
        alert('ลบบัญชีเรียบร้อยแล้ว');
      } else {
        alert(`ลบบัญชีผู้ใช้ ID: ${targetUserId} เรียบร้อยแล้ว`);
        navigate(-1);
      }
    } catch (error) {
      console.error(error);
      alert('ไม่สามารถลบบัญชีได้ในขณะนี้');
    }
  };

  const handleSubscribe = async () => {
    if (!loggedInUser || !token) return;
    
    const confirmed = window.confirm('ยืนยันการสมัคร User Plus ราคา 199 บาท/เดือน?');
    if (confirmed) {
        try {
          const { data: currentUser } = await api.get(`/customers/${loggedInUser.id}`);
          await api.put(`/customers/${loggedInUser.id}`, { ...currentUser, is_plus_member: true });
          const updatedUser = { ...loggedInUser, is_plus_member: true };
          login(updatedUser, token); 
          alert('🎉 ยินดีต้อนรับสู่ User Plus! คุณได้รับสิทธิ์ผ่อนชำระและเปิดร้านค้าแล้ว');
          setShowSubscriptionModal(false);
        } catch (error) {
          console.error("Subscription failed:", error);
          alert("เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่");
        }
    }
  };

  // 📊 Chart Data Calculation (Spending)
  const getChartData = () => {
    const now = new Date();
    let data: number[] = [];
    let labels: string[] = [];
    
    if (chartPeriod === '1D') {
        data = new Array(24).fill(0);
        labels = new Array(24).fill(0).map((_, i) => `${i}:00`);
        spendingOrders.forEach(o => {
            const d = new Date(o.order_date);
            if (d.toDateString() === now.toDateString()) data[d.getHours()] += Number(o.total_price);
        });
    } else if (chartPeriod === '5D') {
        for (let i = 4; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('th-TH', { weekday: 'short' }));
            const total = spendingOrders
                .filter(o => new Date(o.order_date).toDateString() === d.toDateString())
                .reduce((sum, o) => sum + Number(o.total_price), 0);
            data.push(total);
        }
    } else if (chartPeriod === '1M') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        data = new Array(daysInMonth).fill(0);
        labels = new Array(daysInMonth).fill(0).map((_, i) => `${i + 1}`);
        spendingOrders.forEach(o => {
            const d = new Date(o.order_date);
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) data[d.getDate() - 1] += Number(o.total_price);
        });
    } else if (chartPeriod === '1Y') {
        data = new Array(12).fill(0);
        labels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        spendingOrders.forEach(o => {
            const d = new Date(o.order_date);
            if (d.getFullYear() === now.getFullYear()) data[d.getMonth()] += Number(o.total_price);
        });
    } else if (chartPeriod === '5Y') {
        for (let i = 4; i >= 0; i--) {
            const year = now.getFullYear() - i;
            labels.push(String(year));
            const total = spendingOrders.filter(o => new Date(o.order_date).getFullYear() === year).reduce((sum, o) => sum + Number(o.total_price), 0);
            data.push(total);
        }
    }
    return { data, labels, max: Math.max(...data, 1) };
  };

  const chartData = getChartData();
  const totalSpending = spendingOrders.reduce((sum, o) => sum + Number(o.total_price), 0);

  if (isPageLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="ml-4 text-slate-500">กำลังโหลดข้อมูลผู้ใช้...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
      {/* Header */}
      <div className="relative mb-10 p-8 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white shadow-2xl shadow-blue-900/20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
        <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight mb-3 drop-shadow-md">
            {isEditingSelf ? 'ตั้งค่าบัญชีผู้ใช้' : `แก้ไขผู้ใช้: ${username}`}
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl font-medium opacity-90">
            จัดการข้อมูลส่วนตัว ความปลอดภัย และสถานะสมาชิกของคุณในที่เดียว
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar (Profile & Status) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10"></div>
             
             <div className="relative mt-4 mb-4 group">
                <img 
                  src={avatar || "https://placehold.co/150?text=User"} 
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-700 shadow-lg object-cover bg-white"
                  alt="Profile"
                />
                <label className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg border-2 border-white dark:border-slate-800">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={!isEditingSelf} />
                </label>
             </div>

             <h2 className="text-xl font-bold text-slate-800 dark:text-white">{username || 'Unknown User'}</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{gmail || 'No Email'}</p>

             <div className="flex flex-wrap gap-2 justify-center mb-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isAdmin ? 'bg-slate-800 text-white border-slate-700' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                  <Shield className="w-3 h-3" /> {isAdmin ? 'ADMIN' : 'USER'}
                </span>
                {loggedInUser?.is_plus_member && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-white border border-yellow-200 shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse">
                    <Crown className="w-3 h-3 fill-current" /> PLUS MEMBER
                  </span>
                )}
             </div>

             <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between text-xs text-slate-400">
                <span>สมัครเมื่อ: {createdAt ? new Date(createdAt).toLocaleDateString('th-TH') : '-'}</span>
                <span>อัปเดต: {updatedAt ? new Date(updatedAt).toLocaleDateString('th-TH') : '-'}</span>
             </div>
          </div>

          {/* User Plus / Shop Status */}
          {isEditingSelf && (
            <div className={`rounded-3xl p-[2px] shadow-xl relative overflow-hidden transition-all hover:scale-[1.02] ${loggedInUser?.is_plus_member ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-amber-500/20' : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800'}`}>
              <div className={`h-full rounded-[1.4rem] p-6 relative overflow-hidden ${loggedInUser?.is_plus_member ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white' : 'bg-white dark:bg-slate-800'}`}>
                
                {/* Header of Card */}
                <div className="flex items-center gap-3 mb-4">
                   <div className={`p-2.5 rounded-xl shadow-inner ${loggedInUser?.is_plus_member ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                      {loggedInUser?.is_plus_member ? <Crown className="w-6 h-6 fill-current" /> : <Sparkles className="w-6 h-6" />}
                   </div>
                   <div>
                      <h3 className={`font-black text-lg leading-tight ${loggedInUser?.is_plus_member ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-400 drop-shadow-sm' : 'text-slate-800 dark:text-white'}`}>
                        {loggedInUser?.is_plus_member ? 'PREMIUM STATUS' : 'อัปเกรดเป็น PLUS'}
                      </h3>
                      <p className={`text-xs font-medium ${loggedInUser?.is_plus_member ? 'text-slate-400' : 'text-slate-500'}`}>
                        {loggedInUser?.is_plus_member ? 'สถานะสมาชิก: เหนือระดับ (Active)' : 'ปลดล็อกขีดจำกัดของคุณ'}
                      </p>
                   </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1 rounded-full ${loggedInUser?.is_plus_member ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-50 text-blue-600'}`}><Wallet className="w-3 h-3" /></div>
                        <div className="text-sm">
                            <p className={`font-bold ${loggedInUser?.is_plus_member ? 'text-amber-100' : 'text-slate-700 dark:text-slate-200'}`}>ระบบผ่อนชำระ (Pay Later)</p>
                            <p className={`text-xs ${loggedInUser?.is_plus_member ? 'text-slate-400' : 'text-slate-500'}`}>ช้อปก่อนจ่ายทีหลัง วงเงินสูงสุด 5,000฿</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1 rounded-full ${loggedInUser?.is_plus_member ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-50 text-blue-600'}`}><Store className="w-3 h-3" /></div>
                        <div className="text-sm">
                            <p className={`font-bold ${loggedInUser?.is_plus_member ? 'text-amber-100' : 'text-slate-700 dark:text-slate-200'}`}>เปิดร้านค้า (Merchant)</p>
                            <p className={`text-xs ${loggedInUser?.is_plus_member ? 'text-slate-400' : 'text-slate-500'}`}>สร้างร้านอาหารและรับออเดอร์ได้ทันที</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1 rounded-full ${loggedInUser?.is_plus_member ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-50 text-blue-600'}`}><TrendingUp className="w-3 h-3" /></div>
                        <div className="text-sm">
                            <p className={`font-bold ${loggedInUser?.is_plus_member ? 'text-amber-100' : 'text-slate-700 dark:text-slate-200'}`}>แดชบอร์ดร้านค้า</p>
                            <p className={`text-xs ${loggedInUser?.is_plus_member ? 'text-slate-400' : 'text-slate-500'}`}>ดูยอดขายและสถิติแบบ Real-time</p>
                        </div>
                    </div>
                </div>

                  {loggedInUser?.is_plus_member ? (
                      <button 
                        onClick={() => navigate('/my-shop')}
                        className="w-full py-3 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-900 rounded-xl text-sm font-black hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <Store className="w-4 h-4" /> เข้าสู่ระบบร้านค้า
                      </button>
                  ) : (
                      <button 
                        onClick={() => setShowSubscriptionModal(true)}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:scale-[1.02] transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> สมัครสมาชิก (199฿ / เดือน)
                      </button>
                  )}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/30">
             <h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
             </h3>
             <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-4">
                การลบบัญชีจะไม่สามารถกู้คืนข้อมูลได้
             </p>
             <button 
                onClick={handleDeleteAccount}
                className="w-full py-2 bg-white dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> ลบบัญชีผู้ใช้
              </button>
          </div>

        </div>

        {/* Right Content (Forms) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. General Information Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="p-2 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg">
                   <User className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">ข้อมูลส่วนตัว</h3>
                   <p className="text-xs text-slate-500">แก้ไขข้อมูลพื้นฐานของคุณ</p>
                </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ชื่อผู้ใช้ (Username)</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white"
                        placeholder="Username"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">อีเมล (Gmail)</label>
                      <input 
                        type="email" 
                        value={gmail}
                        onChange={e => setGmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white"
                        placeholder="example@gmail.com"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ชื่อจริง</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white"
                        placeholder="First Name"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">นามสกุล</label>
                      <input 
                        type="text" 
                        value={lastname}
                        onChange={e => setLastname(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white"
                        placeholder="Last Name"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">เบอร์โทรศัพท์</label>
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white"
                      placeholder="08X-XXX-XXXX"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ที่อยู่จัดส่ง</label>
                    <textarea 
                      value={address}
                      rows={3}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-medium text-slate-800 dark:text-white"
                      placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด..."
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      บันทึกการเปลี่ยนแปลง
                    </button>
                </div>
             </form>
          </div>

          {/* 2. Security Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="p-2 bg-amber-50 dark:bg-slate-700 text-amber-600 dark:text-amber-400 rounded-lg">
                   <KeyRound className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">รหัสผ่านและความปลอดภัย</h3>
                   <p className="text-xs text-slate-500">เปลี่ยนรหัสผ่านเพื่อความปลอดภัย</p>
                </div>
             </div>

             <form onSubmit={handlePasswordChange} className="space-y-6">
                {isEditingSelf && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">รหัสผ่านปัจจุบัน</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="password" 
                          required
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium text-slate-800 dark:text-white"
                          placeholder="••••••••"
                        />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{isEditingSelf ? 'รหัสผ่านใหม่' : 'ตั้งรหัสผ่านใหม่'}</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="password" 
                          required
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium text-slate-800 dark:text-white"
                          placeholder="••••••••"
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ยืนยันรหัสผ่าน</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="password" 
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium text-slate-800 dark:text-white"
                          placeholder="••••••••"
                        />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isPasswordLoading}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      {isPasswordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'เปลี่ยนรหัสผ่าน'}
                    </button>
                </div>
             </form>
          </div>

          {/* 3. Spending History Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-slate-700 text-green-600 dark:text-green-400 rounded-lg">
                       <BarChart className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-800 dark:text-white">ประวัติการใช้จ่าย</h3>
                       <p className="text-xs text-slate-500">ยอดรวมทั้งหมด: <span className="font-bold text-green-600">฿{totalSpending.toLocaleString()}</span></p>
                    </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    {(['1D', '5D', '1M', '1Y', '5Y'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setChartPeriod(p)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartPeriod === p ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
             </div>

             <div className="h-56 flex items-end gap-2">
                {chartData.data.map((value, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                            ฿{value.toLocaleString()}
                        </div>
                        {/* Bar */}
                        <div 
                            className="w-full bg-green-50 dark:bg-slate-700 rounded-t-sm relative overflow-hidden transition-all duration-500 group-hover:bg-green-100 dark:group-hover:bg-slate-600"
                            style={{ height: `${(value / chartData.max) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
                        >
                            <div className="absolute bottom-0 left-0 right-0 bg-green-500 h-full opacity-80"></div>
                        </div>
                        {/* Label */}
                        <span className="text-[9px] text-slate-400 mt-2 truncate w-full text-center">{chartData.labels[idx]}</span>
                    </div>
                ))}
             </div>
          </div>

        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative">
                <button onClick={() => setShowSubscriptionModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10">
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-8 text-center relative overflow-hidden border-b border-amber-500/20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500 rounded-full blur-3xl opacity-20"></div>
                    
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-[0_0_30px_rgba(245,158,11,0.4)] rotate-3 border border-white/20">
                        <Crown className="w-10 h-10 fill-current" />
                    </div>
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-400 tracking-tight drop-shadow-sm">User Plus</h3>
                    <p className="text-amber-100/60 text-sm font-medium mt-1">ปลดล็อกขีดจำกัดของคุณ เพียง 199฿</p>
                </div>

                <div className="p-8">
                    <div className="space-y-5 mb-8">
                        <div className="flex items-start gap-4 text-gray-700">
                            <div className="p-3 bg-green-100 rounded-xl text-green-600 shrink-0"><Wallet className="w-6 h-6" /></div>
                            <div>
                                <span className="block text-base font-bold text-gray-800">ระบบผ่อนชำระ (Pay Later)</span>
                                <span className="text-xs text-gray-500">รับวงเงินเครดิตสูงสุด 5,000 บาท สั่งอาหารก่อน จ่ายทีหลังได้</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 text-gray-700">
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 shrink-0"><Store className="w-6 h-6" /></div>
                            <div>
                                <span className="block text-base font-bold text-gray-800">เปิดร้านอาหารของคุณเอง</span>
                                <span className="text-xs text-gray-500">สร้างร้านค้า จัดการเมนู และรับออเดอร์จากลูกค้าได้ทันที</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="p-2 bg-purple-100 rounded-full text-purple-600"><CheckCircle2 className="w-4 h-4" /></div>
                            <span className="text-sm font-medium">เพิ่มเมนูได้สูงสุด 10 รายการ</span>
                        </div>
                    </div>

                    <button onClick={handleSubscribe} className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all shadow-md border border-slate-700 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        สมัครเลย ฿199 / เดือน
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">ยกเลิกได้ตลอดเวลา • ชำระผ่านบัตรเครดิต</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

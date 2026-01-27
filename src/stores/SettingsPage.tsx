import { useState, useEffect } from 'react';
import { User, Save, Loader2, Camera, Shield, Mail, Lock, Trash2, AlertTriangle, Store, Phone, MapPin, Calendar, Info, KeyRound, Sparkles, CreditCard, CheckCircle2, X } from 'lucide-react';
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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false); // ✅ Modal สมัคร Plus

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

          // ✅ เพิ่ม: Sync ข้อมูลลง Store ถ้าเป็นตัวเอง (เพื่อให้ปุ่มสมัครหายไป)
          if (isEditingSelf && loggedInUser) {
             if (fullUserData.is_plus_member !== loggedInUser.is_plus_member) {
                 const updatedUser = { ...loggedInUser, is_plus_member: fullUserData.is_plus_member };
                 login(updatedUser, token || '');
             }
          }
        } catch (error) {
          console.error(`Failed to fetch user details for ID: ${targetUserId}`, error);
          alert('ไม่สามารถดึงข้อมูลผู้ใช้ได้ หรือผู้ใช้ไม่มีอยู่จริง');
          // If admin fails to fetch a user, redirect them
          if (isAdmin && !isEditingSelf) {
            navigate('/admin/shops'); // Or a user management page
          }
        } finally {
          setIsPageLoading(false);
        }
      };
      fetchUserData();
    }
  }, [targetUserId, navigate, isAdmin, isEditingSelf]);

  // ฟังก์ชันย่อรูป (Reuse มาจากส่วนอื่น)
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300; // รูปโปรไฟล์เอาเล็กๆ ก็พอ
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
    if (!targetUserId || !token) return;

    setIsSaving(true);
    try {
      // 1. อัปเดตข้อมูลที่ Server (ใช้ /customers ตาม login.ts)
      // หมายเหตุ: Backend จริงอาจใช้ /users หรือ /profile แล้วแต่การออกแบบ
      const { data: responseData } = await api.patch(`/customers/${targetUserId}`, {
        username: username,
        fullname: name, // map name -> fullname ตามโครงสร้าง db
        lastname: lastname,
        phone_number: phoneNumber,
        gmail: gmail,
        address: address,
        image_url: avatar,
        updated_at: new Date().toISOString(), // อัปเดตเวลาแก้ไข
      });

      // 2. อัปเดตข้อมูลใน Store ฝั่ง Client ทันที (เฉพาะเมื่อแก้ไขข้อมูลตัวเอง)
      if (isEditingSelf && loggedInUser) {
        const updatedUser = { ...loggedInUser, username: responseData.username, name: responseData.fullname, avatar_url: responseData.image_url };
        login(updatedUser, token);
      }

      // 3. อัปเดตข้อมูลที่แสดงผลในหน้าจอ โดยเฉพาะ updated_at
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
      // Admin doesn't need current password to reset for others.
      // Only check current password if user is editing themselves.
      if (isEditingSelf) {
        // 1. ดึงข้อมูล User ล่าสุดเพื่อเช็ครหัสเดิม
        const { data: currentUser } = await api.get(`/customers/${targetUserId}`);
        
        // 2. เช็ครหัสเดิม (Hash)
        const currentPasswordHash = sha256(currentPassword);
        
        if (currentUser.password !== currentPasswordHash) { 
           alert('รหัสผ่านเดิมไม่ถูกต้อง');
           setIsPasswordLoading(false);
           return;
        }
      }

      // 3. อัปเดตรหัสใหม่
      const newPasswordHash = sha256(newPassword);
      await api.patch(`/customers/${targetUserId}`, {
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
        navigate(-1); // กลับไปหน้าก่อนหน้า (เช่น หน้าจัดการผู้ใช้)
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
          // ✅ 1. ยิง API อัปเดตฐานข้อมูลจริง
          await api.patch(`/customers/${loggedInUser.id}`, { is_plus_member: true });

          // ✅ 2. อัปเดต Store ฝั่ง Frontend
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

  if (isPageLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="ml-4 text-slate-500">กำลังโหลดข้อมูลผู้ใช้...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Card & Main Form */}
      <div className="lg:col-span-2 space-y-8">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
          {isEditingSelf ? 'ตั้งค่าบัญชี' : `แก้ไขข้อมูลผู้ใช้: ${username}`}
        </h1>
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Cover Background */}
        <div className="h-40 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>
        
        <div className="px-8 pb-8">
          {/* Avatar Upload */}
          <div className="relative -mt-20 mb-8 text-center">
            <div className="relative inline-block group">
              <img 
                src={avatar || "https://placehold.co/150?text=User"} 
                className="w-40 h-40 rounded-full border-[6px] border-white dark:border-slate-700 shadow-2xl object-cover bg-white"
                alt="Profile"
              />
              <label className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full cursor-pointer hover:bg-gray-700 transition-colors shadow-sm">
                <Camera className="w-5 h-5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={!isEditingSelf} />
              </label>
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isAdmin ? 'bg-gray-800 text-white' : 'bg-amber-100 text-amber-700'}`}>
                <Shield className="w-3 h-3" /> {isAdmin && !isEditingSelf ? 'USER' : loggedInUser?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">ชื่อผู้ใช้ (Username)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">ชื่อจริง</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="Full Name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">นามสกุล</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={lastname}
                    onChange={e => setLastname(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                    placeholder="Last Name"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">เบอร์โทรศัพท์</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="Phone Number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">ที่อยู่</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                <textarea 
                  value={address}
                  rows={3}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-900 outline-none resize-none"
                  placeholder="Address"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-900/30 hover:scale-[1.01] transition-all flex justify-center items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> บันทึกการเปลี่ยนแปลง</>}
            </button>
          </form>
        </div>
      </div>
      </div>

      {/* Side Column for Password, Info, and Danger Zone */}
      <div className="lg:col-span-1 space-y-8">
        {/* Password Change Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-600" /> เปลี่ยนรหัสผ่าน
          </h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {isEditingSelf && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">รหัสผ่านปัจจุบัน</label>
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="••••••••"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{isEditingSelf ? 'รหัสผ่านใหม่' : 'ตั้งรหัสผ่านใหม่'}</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">ยืนยันรหัสผ่าน</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPasswordLoading}
              className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex justify-center items-center gap-2"
            >
              {isPasswordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ยืนยันการเปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        </div>

        {/* Account Info Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" /> ข้อมูลบัญชี
          </h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="font-medium text-gray-500">Customer ID:</span>
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{targetUserId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">Gmail:</span>
              <span>{gmail || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">สมัครเมื่อ:</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-gray-400"/> {createdAt ? new Date(createdAt).toLocaleDateString('th-TH') : '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">แก้ไขล่าสุด:</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-gray-400"/> {updatedAt ? new Date(updatedAt).toLocaleDateString('th-TH') : '-'}</span>
            </div>
          </div>
        </div>

        {/* 🌟 User Plus / Merchant Section */}
        {isEditingSelf && loggedInUser?.role !== 'ADMIN' && (
          <div className={`rounded-3xl shadow-lg border p-6 relative overflow-hidden ${loggedInUser?.is_plus_member ? 'bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-blue-800' : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 border-amber-200 dark:border-slate-700'}`}>
            
            {/* Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

            <div className="relative z-10">
                <h2 className={`text-lg font-black mb-2 flex items-center gap-2 ${loggedInUser?.is_plus_member ? 'text-white' : 'text-amber-800 dark:text-amber-400'}`}>
                  {loggedInUser?.is_plus_member ? <><Sparkles className="w-5 h-5 text-yellow-400" /> User Plus Member</> : <><Store className="w-5 h-5" /> สำหรับผู้ประกอบการ</>}
                </h2>
                
                <p className={`text-sm mb-4 ${loggedInUser?.is_plus_member ? 'text-blue-100' : 'text-gray-600 dark:text-slate-300'}`}>
                  {loggedInUser?.is_plus_member 
                    ? 'คุณได้รับสิทธิ์พิเศษ: ผ่อนชำระสินค้า และเปิดร้านค้าได้ 1 ร้าน (สูงสุด 10 เมนู)' 
                    : 'ต้องการเปิดร้านค้าและใช้ระบบผ่อนชำระ? อัปเกรดเป็น User Plus วันนี้'}
                </p>

                {loggedInUser?.is_plus_member ? (
                    <button 
                      onClick={() => navigate('/my-shop')} // ✅ ให้ MyShopRedirect ตัดสินใจเอง
                      className="w-full py-2.5 bg-white text-blue-900 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Store className="w-4 h-4" /> จัดการร้านค้าของคุณ
                    </button>
                ) : (
                    <button 
                      onClick={() => setShowSubscriptionModal(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:scale-[1.02] transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> สมัคร User Plus (199฿/ด.)
                    </button>
                )}
            </div>
          </div>
        )}

        {/* Delete Account Section */}
        <div className="bg-red-50/50 dark:bg-red-900/10 rounded-3xl shadow-lg border border-red-100 dark:border-red-900/30 p-6">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> โซนอันตราย
          </h2>
          <p className="text-sm text-gray-500 dark:text-red-200/70 mb-4">หากลบบัญชี ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้</p>
          
          <button 
            onClick={handleDeleteAccount}
            className="w-full px-4 py-2 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> ลบบัญชีผู้ใช้ถาวร
          </button>
        </div>
      </div>

      {/* 💎 Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative">
                <button onClick={() => setShowSubscriptionModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10">
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="bg-blue-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 text-yellow-400 shadow-inner border border-white/20">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">User Plus</h3>
                    <p className="text-blue-200 text-sm">ปลดล็อกขีดจำกัดของคุณ</p>
                </div>

                <div className="p-8">
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="p-2 bg-green-100 rounded-full text-green-600"><CreditCard className="w-4 h-4" /></div>
                            <span className="text-sm font-medium">ระบบผ่อนชำระ (Pay Later)</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Store className="w-4 h-4" /></div>
                            <span className="text-sm font-medium">สร้างร้านอาหารได้ 1 ร้าน</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="p-2 bg-purple-100 rounded-full text-purple-600"><CheckCircle2 className="w-4 h-4" /></div>
                            <span className="text-sm font-medium">เพิ่มเมนูได้สูงสุด 10 รายการ</span>
                        </div>
                    </div>

                    <button onClick={handleSubscribe} className="w-full py-3.5 bg-blue-900 text-white rounded-xl font-bold text-lg hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
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
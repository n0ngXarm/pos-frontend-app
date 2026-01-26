import { useState, useEffect } from 'react';
import { User, Save, Loader2, Camera, Shield, Mail, Lock, Trash2, AlertTriangle, Store } from 'lucide-react';
import { useAuthStore } from './use-auth-store';
import { api } from '../lib/axios';
import { sha256 } from 'js-sha256';
import { useNavigate } from 'react-router-dom';

export const SettingsPage = () => {
  const { user, login, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setName(user.name || '');
      setAvatar(user.avatar_url || '');
    }
  }, [user]);

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
    if (!user || !token) return;

    setIsLoading(true);
    try {
      // 1. อัปเดตข้อมูลที่ Server (ใช้ /customers ตาม login.ts)
      // หมายเหตุ: Backend จริงอาจใช้ /users หรือ /profile แล้วแต่การออกแบบ
      await api.patch(`/customers/${user.id}`, {
        username: username,
        fullname: name, // map name -> fullname ตามโครงสร้าง db
        image_url: avatar
      });

      // 2. อัปเดตข้อมูลใน Store ฝั่ง Client ทันที
      const updatedUser = { ...user, username, name, avatar_url: avatar };
      login(updatedUser, token);

      alert('✅ บันทึกข้อมูลเรียบร้อย');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึก (Server อาจไม่รองรับการแก้ไข)');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
      // 1. ดึงข้อมูล User ล่าสุดเพื่อเช็ครหัสเดิม
      const { data: currentUser } = await api.get(`/customers/${user.id}`);
      
      // 2. เช็ครหัสเดิม (Hash)
      const currentPasswordHash = sha256(currentPassword);
      
      if (currentUser.password !== currentPasswordHash) { 
         alert('รหัสผ่านเดิมไม่ถูกต้อง');
         setIsPasswordLoading(false);
         return;
      }

      // 3. อัปเดตรหัสใหม่
      const newPasswordHash = sha256(newPassword);
      await api.patch(`/customers/${user.id}`, {
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
    if (!user) return;
    const confirmed = window.confirm('⚠️ คำเตือน: คุณแน่ใจหรือไม่ที่จะลบบัญชีนี้?\n\nข้อมูลประวัติการสั่งซื้อและการตั้งค่าทั้งหมดจะหายไปถาวร!');
    if (!confirmed) return;

    try {
      await api.delete(`/customers/${user.id}`);
      logout();
      navigate('/login');
      alert('ลบบัญชีเรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      alert('ไม่สามารถลบบัญชีได้ในขณะนี้');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">ตั้งค่าบัญชี ⚙️</h1>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Cover Background */}
        <div className="h-32 bg-gradient-to-r from-slate-700 to-stone-600"></div>
        
        <div className="px-8 pb-8">
          {/* Avatar Upload */}
          <div className="relative -mt-16 mb-6 text-center">
            <div className="relative inline-block group">
              <img 
                src={avatar || "https://placehold.co/150?text=User"} 
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                alt="Profile"
              />
              <label className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full cursor-pointer hover:bg-slate-700 transition-colors shadow-sm">
                <Camera className="w-5 h-5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${user?.role === 'ADMIN' ? 'bg-slate-800 text-white' : 'bg-amber-100 text-amber-700'}`}>
                <Shield className="w-3 h-3" /> {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้ (Username)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อที่แสดง (Display Name)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="ชื่อ-นามสกุล หรือ ชื่อเล่น"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 hover:scale-[1.01] transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-200"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> บันทึกการเปลี่ยนแปลง</>}
            </button>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="px-8 pb-8 pt-6 border-t border-gray-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" /> เปลี่ยนรหัสผ่าน
          </h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่านปัจจุบัน</label>
              <input 
                type="password" 
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่านใหม่</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPasswordLoading}
              className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors flex justify-center items-center gap-2"
            >
              {isPasswordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ยืนยันการเปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        </div>

        {/* Merchant Section (For User only) */}
        {user?.role !== 'ADMIN' && (
          <div className="px-8 pb-8 pt-6 border-t border-gray-100 bg-amber-50">
            <h2 className="text-lg font-bold text-amber-800 mb-2 flex items-center gap-2">
              <Store className="w-5 h-5" /> สำหรับผู้ประกอบการ
            </h2>
            <p className="text-sm text-slate-600 mb-4">ต้องการเปิดร้านค้าบนแพลตฟอร์มของเรา? สมัครฟรีวันนี้</p>
            <button 
              onClick={() => navigate('/register-shop')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Store className="w-4 h-4" /> สมัครเปิดร้านค้า
            </button>
          </div>
        )}

        {/* Delete Account Section */}
        <div className="px-8 pb-8 pt-6 border-t border-gray-100 bg-red-50/30">
          <h2 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> โซนอันตราย
          </h2>
          <p className="text-sm text-slate-500 mb-4">หากลบบัญชี ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้</p>
          
          <button 
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> ลบบัญชีผู้ใช้ถาวร
          </button>
        </div>
      </div>
    </div>
  );
};
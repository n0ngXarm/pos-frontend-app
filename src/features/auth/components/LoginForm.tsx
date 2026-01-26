// src/features/auth/components/LoginForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

// Import แบบ Relative (ปลอดภัย 100%)
import { useAuthStore } from '../../../stores/use-auth-store';
import { loginWithUsername } from '../api/login';
import { LoginSchema, type LoginCredentials } from '../types';

export const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // เรียกใช้ Store
  const setAuth = useAuthStore((state) => state.login);

  // Setup Form + Validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. ยิง API
      const response = await loginWithUsername(data);
      
      // 2. เก็บลง Store (Auto save ลง LocalStorage)
      setAuth(response.user, response.token);
      
      // 3. เปลี่ยนหน้า (เดี๋ยวเราไปทำ Router กันต่อ)
      alert(`ยินดีต้อนรับ ${response.user.username}! (Login สำเร็จ)`);
      window.location.href = '/dashboard'; // ชั่วคราว

    } catch (err: any) {
      // จัดการ Error (ถ้า Backend ส่ง message มาก็เอามาโชว์)
      console.error(err);
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h1>
        <p className="text-gray-500 mt-2">จัดการร้านค้าและออเดอร์ของคุณ</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
            ⚠️ {error}
          </div>
        )}

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
          <input
            {...register('username')}
            disabled={isLoading}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none transition-all ${
              errors.username ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="กรอกชื่อผู้ใช้"
          />
          {errors.username && (
            <p className="text-xs text-red-500">{errors.username.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
          <input
            type="password"
            {...register('password')}
            disabled={isLoading}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none transition-all ${
              errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              กำลังตรวจสอบ...
            </>
          ) : (
            'เข้าสู่ระบบ'
          )}
        </button>
      </form>
    </div>
  );
};
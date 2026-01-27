import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, ChefHat, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/use-auth-store';
import { loginWithUsername } from '../api/login';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginWithUsername({ username, password });
      setAuth(response.user, response.token, response.refreshToken);
      // Redirect based on role
      const target = response.user.role === 'ADMIN' ? '/admin/shops' : '/shops';
      navigate(target);
    } catch (err: any) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 p-4 relative overflow-hidden">
      {/* 🎨 Background Decorations */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] -right-[10%] w-[600px] h-[600px] bg-gray-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[800px] h-[800px] bg-amber-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md glass-panel bg-white/10 rounded-[2.5rem] overflow-hidden relative z-10">
        {/* Header */}
        <div className="p-10 pb-0 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-6 rotate-3 border-4 border-white/10">
              <ChefHat className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Street<span className="text-amber-400">Eats</span>
            </h1>
            <p className="text-gray-300 text-sm mt-2 font-light">เข้าสู่ระบบเพื่อสั่งความอร่อย</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-200 ml-1">ชื่อผู้ใช้</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-gray-900/80 outline-none transition-all font-medium text-white placeholder:text-gray-600"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-200 ml-1">รหัสผ่าน</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-gray-900/80 outline-none transition-all font-medium text-white placeholder:text-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  เข้าสู่ระบบ <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm mb-3">ยังไม่มีบัญชีใช่ไหม?</p>
            <Link 
              to="/register" 
              className="inline-flex items-center justify-center w-full py-3 border border-white/20 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              สมัครสมาชิกใหม่
            </Link>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-white/60 text-xs font-medium">© 2024 StreetEats POS System</div>
    </div>
  );
};
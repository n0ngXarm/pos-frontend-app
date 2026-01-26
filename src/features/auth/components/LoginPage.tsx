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
      setAuth(response.user, response.token);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-blue-900 to-stone-900 p-4 relative overflow-hidden">
      {/* 🎨 Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-stone-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative z-10">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 rotate-3">
              <ChefHat className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Street<span className="text-amber-400">Eats</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">เข้าสู่ระบบเพื่อสั่งความอร่อย</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">ชื่อผู้ใช้</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:bg-white outline-none transition-all font-medium text-slate-800"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">รหัสผ่าน</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:bg-white outline-none transition-all font-medium text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
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
            <p className="text-slate-500 text-sm mb-3">ยังไม่มีบัญชีใช่ไหม?</p>
            <Link 
              to="/register" 
              className="inline-flex items-center justify-center w-full py-3 border-2 border-blue-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
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
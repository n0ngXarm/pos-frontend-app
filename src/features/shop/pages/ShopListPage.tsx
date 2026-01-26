import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, ChefHat } from 'lucide-react';
import { getRestaurants } from '../api/shopService';
import type { Restaurant } from '../types';
import { ShopCard } from '../components/ShopCard';
import { useAuthStore } from '../../../stores/use-auth-store';

export const ShopListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // 👈 ดึงข้อมูล User มาเช็ค
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRestaurants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRestaurants();
      setRestaurants(data);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter(shop => 
    shop.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* 🌟 Hero Section (Modern) */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-slate-900 to-blue-900 text-white p-8 md:p-16 shadow-2xl shadow-slate-300">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900/80 to-transparent"></div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-amber-500 text-slate-900 text-xs font-bold rounded-full mb-4 tracking-wider uppercase">Premium Selection</span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Golden</span><br/>Taste & Quality
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 font-light max-w-lg">
            สั่งอาหารจากร้านโปรดของคุณได้ง่ายๆ ผ่านมือถือ พร้อมเสิร์ฟความอร่อยถึงโต๊ะ
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 p-2 rounded-lg">🏪</span> ร้านอาหารแนะนำ
        </h2>
        
        {/* 👇 เช็คสิทธิ์ก่อนโชว์: ต้องเป็น ADMIN เท่านั้นถึงจะเห็นปุ่มนี้ */}
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => navigate('/admin/orders')} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ChefHat className="w-5 h-5 text-amber-400" /> ไปที่ห้องครัว
          </button>
        )}

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      {error && (
        <div className="p-8 bg-red-50 text-red-600 rounded-xl text-center border border-red-100">
          <p className="font-medium mb-4">{error}</p>
          <button 
            onClick={fetchRestaurants}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
          >
            ลองใหม่อีกครั้ง ↻
          </button>
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRestaurants.map((shop) => {
            if (!shop.restaurant_id) return null;

            return (
              <ShopCard 
                key={shop.restaurant_id} 
                data={shop} 
                onClick={() => navigate(`/shops/${shop.restaurant_id}`)} 
              />
            );
          })}
          
          {filteredRestaurants.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              ไม่พบร้านค้าที่ค้นหา
            </div>
          )}
        </div>
      )}
    </div>
  );
};
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, ChefHat, Sparkles, TrendingUp } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [isExiting, setIsExiting] = useState(false);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching restaurants..."); // 👈 เพิ่ม Log 1
      const data = await getRestaurants();
      
      // ✅ แก้ไข: เช็คว่าเป็น Array จริงไหม ถ้าไม่ใช่ให้เป็น [] กันจอขาว
      console.log("API Response:", data); // ดูข้อมูลดิบใน Console
      if (Array.isArray(data)) {
        setRestaurants(data);
      } else {
        console.warn("API did not return an array:", data);
        setRestaurants([]);
      }
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

  console.log("Rendering ShopList, Restaurants:", restaurants); // 👈 เพิ่ม Log 2

  const categories = ["ทั้งหมด", "อาหารตามสั่ง", "ก๋วยเตี๋ยว", "เครื่องดื่ม", "ของหวาน", "Fast Food", "Bakery"];

  // ✅ แก้ไข: กันตายอีกรอบตอน Render
  const safeRestaurants = Array.isArray(restaurants) ? restaurants : [];
  const filteredRestaurants = safeRestaurants
    .filter(shop => shop && typeof shop === 'object') // 🛡️ กรองร้านที่เป็น null ทิ้งก่อน
    .filter(shop => {
      const matchesSearch = (shop.restaurant_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ทั้งหมด' 
        ? true 
        : (shop as any).category === selectedCategory || (shop.restaurant_name || "").includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });

  const handleShopClick = (id: number) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(`/shops/${id}`);
    }, 400);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className={`space-y-8 pb-32 transition-all duration-500 ease-in-out ${isExiting ? 'opacity-0 scale-95 translate-y-4 filter blur-sm' : 'opacity-100 scale-100 translate-y-0 blur-0'}`}>
      {/* 🌟 Hero Section (Clean & Friendly) */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -ml-10 -mb-10"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium rounded-full tracking-wide">
                <Sparkles className="w-3 h-3 text-amber-400" /> Premium Selection
             </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
            ค้นพบความอร่อย <br/><span className="text-blue-400">จากร้านค้าชั้นนำ</span>
          </h1>
          <p className="text-lg text-slate-300 mb-0 font-light max-w-lg">
            สั่งง่าย จ่ายสะดวก พร้อมเสิร์ฟถึงโต๊ะคุณ
          </p>
        </div>
      </div>

      {/* 🏷️ Categories Filter */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-3 rounded-full whitespace-nowrap transition-all font-bold text-sm border shadow-sm ${
              selectedCategory === cat 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl"><TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /></span> ร้านอาหารแนะนำ
        </h2>
        
        {/* 👇 เช็คสิทธิ์ก่อนโชว์: ต้องเป็น ADMIN เท่านั้นถึงจะเห็นปุ่มนี้ */}
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => navigate('/admin/orders')} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <ChefHat className="w-5 h-5 text-amber-400" /> ไปที่ห้องครัว
          </button>
        )}

        <div className="relative w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white font-medium"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredRestaurants.map((shop, index) => {
            if (!shop.restaurant_id) return null;

            return (
              <div 
                key={shop.restaurant_id} 
                className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ShopCard 
                    data={shop} 
                    onClick={() => handleShopClick(shop.restaurant_id)} 
                />
              </div>
            );
          })}
          
          {filteredRestaurants.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              ไม่พบร้านค้าที่ค้นหา
            </div>
          )}
        </div>
      )}
    </div>
  );
};
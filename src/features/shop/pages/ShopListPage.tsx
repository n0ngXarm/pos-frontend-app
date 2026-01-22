import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { getRestaurants } from '../api/shopService';
import type { Restaurant, Menu } from '../types';
import { ShopCard } from '../components/ShopCard';

export const ShopListPage = () => {
  const navigate = useNavigate();
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
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">ร้านอาหารทั้งหมด 🏪</h1>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="ค้นหาร้าน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
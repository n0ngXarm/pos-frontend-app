// src/features/shop/pages/ShopListPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { getRestaurants } from '../api/shopService';
import type { Restaurant } from '../types';
import { ShopCard } from '../components/ShopCard';

export const ShopListPage = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRestaurants();
        setRestaurants(data);
      } catch (err) {
        console.error(err);
        setError("ไม่สามารถดึงข้อมูลร้านค้าได้");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const filteredRestaurants = restaurants.filter(shop => 
    shop.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">เลือกร้านอาหาร</h1>
          <p className="text-slate-500">สั่งอาหารจากร้านโปรดของคุณได้เลย</p>
        </div>
        
        {/* Search Bar (ทำ UI ไว้ก่อน) */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหาร้านอาหาร..." 
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRestaurants.map((shop) => {
          // 👇 เพิ่มด่านตรวจคนเข้าเมือง: ร้านไหนไม่มี ID หรือ ID เป็น 0 ให้เตะออก!
          if (!shop.restaurant_id) {
             console.warn("🚫 พบร้านค้าข้อมูลไม่ครบ (ข้าม):", shop);
             return null;
          }

          return (
            <ShopCard 
              key={shop.restaurant_id} 
              data={shop} 
              // 👇 เพิ่มท่าไม้ตาย: ถ้า shop.restaurant_id เป็น undefined ให้ใช้ shop.id แทน (กันเหนียว)
              onClick={() => navigate(`/shops/${shop.restaurant_id}`)} 
            />
          );
        })}
      </div>

      {/* Empty State */}
      {!isLoading && filteredRestaurants.length === 0 && !error && (
        <div className="text-center py-20 text-slate-400">
          ไม่พบร้านค้าในขณะนี้
        </div>
      )}
    </div>
  );
};
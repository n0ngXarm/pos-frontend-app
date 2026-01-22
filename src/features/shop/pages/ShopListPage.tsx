// src/features/shop/pages/ShopDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MapPin, Phone } from 'lucide-react'; // เพิ่ม Icon
import { getRestaurantById, getMenusByRestaurantId } from '../api/shopService';
import type { Restaurant, Menu } from '../types';
import { MenuCard } from '../../menu/components/MenuCard';
import { useCartStore } from '../../../stores/useCartStore';

export const ShopDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItemToCart = useCartStore((state) => state.addItem);

  const [shop, setShop] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  
  // สถานะการโหลด
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ถ้าไม่มี ID ไม่ต้องทำอะไรเลย (เดี๋ยว Service จัดการให้)
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true); 
      try {
        // โหลดพร้อมกัน 2 ทาง (Parallel) เพื่อความไว
        const [shopData, menusData] = await Promise.all([
          getRestaurantById(id),
          getMenusByRestaurantId(id)
        ]);

        if (shopData) setShop(shopData);
        if (menusData) setMenus(menusData);
        
      } catch (error) {
        console.error("Error loading details:", error);
      } finally {
        setIsLoading(false); // จบงานแล้ว ปิดหน้าโหลด
      }
    };

    fetchData();
  }, [id]);

  // 1. Loading State: โชว์ Skeleton สวยๆ (กล่องเทาๆ)
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
        
        {/* Menu Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 bg-gray-200 rounded-xl"></div>
            ))}
        </div>
      </div>
    );
  }

  // 2. Error State: ถ้าหาไม่เจอจริงๆ
  if (!shop) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">ไม่พบข้อมูลร้านค้า</h2>
        <button onClick={() => navigate('/shops')} className="text-indigo-600 mt-4 hover:underline">
          กลับไปหน้ารวมร้านค้า
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header ร้านค้า */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 relative">
        <button 
            onClick={() => navigate('/shops')} 
            className="absolute top-4 left-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm z-10 text-slate-500 hover:text-slate-800 transition-colors"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>

        <img 
          src={shop.image_url || "https://placehold.co/100"} 
          className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md"
        />
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{shop.restaurant_name}</h1>
          <div className="flex flex-col md:flex-row gap-3 text-slate-500 text-sm justify-center md:justify-start">
            <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {shop.address}
            </div>
            <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {shop.phone}
            </div>
          </div>
        </div>
      </div>

      {/* รายการเมนู */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="bg-indigo-600 w-2 h-6 rounded-full inline-block"></span>
            เมนูแนะนำ
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menus.length > 0 ? (
            menus.map((menu) => (
                <MenuCard 
                    key={menu.menu_id} 
                    data={menu} 
                    onAddToCart={(item) => {
                        addItemToCart(item);
                        // ถ้าอยากใช้ Alert ก็ uncomment บรรทัดล่าง
                        // alert(`เพิ่ม ${item.menu_name} ลงตะกร้าแล้ว`); 
                    }}
                />
            ))
            ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-gray-200 text-slate-400">
                <ShoppingBag className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="text-lg">ร้านนี้ยังไม่มีเมนูอาหาร</p>
                <p className="text-sm opacity-70">แวะมาใหม่วันหลังนะ</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};
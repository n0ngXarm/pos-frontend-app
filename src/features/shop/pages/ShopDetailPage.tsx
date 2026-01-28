// src/features/shop/pages/ShopDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MapPin, Phone, AlertCircle, Star, Utensils } from 'lucide-react';
import { getRestaurantById, getMenusByRestaurantId } from '../api/shopService';
import type { Restaurant, Menu } from '../types';
import { MenuCard } from '../components/MenuCard';
import { useCartStore } from '../../../stores/useCartStore';

export const ShopDetailPage = () => {
  const { id } = useParams(); // รับ ID จาก URL
  const navigate = useNavigate();
  const addItemToCart = useCartStore((state) => state.addItem);

  const [shop, setShop] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true); // เริ่มต้นที่โหลด

  useEffect(() => {
    // 🛡️ 1. เช็คก่อนเลย ถ้า ID เน่า ให้เด้งกลับหน้าหลัก
    if (!id || id === 'undefined') {
        console.warn("Invalid ID detected, Redirecting...");
        navigate('/shops');
        return;
    }

    const fetchData = async () => {
      setIsLoading(true); // เริ่มหมุนติ้วๆ
      try {
        const [shopData, menusData] = await Promise.all([
          getRestaurantById(Number(id)),
          getMenusByRestaurantId(Number(id))
        ]);

        // ✅ เพิ่ม Log เพื่อตรวจสอบข้อมูล (กด F12 ดูที่ Console)
        console.log("Shop Data:", shopData);
        console.log("Menus Data:", menusData);

        if (shopData) setShop(shopData);
        if (menusData) setMenus(menusData);
      } catch (error) {
        console.error("Critical Error:", error);
      } finally {
        setIsLoading(false); // ✅ สำคัญมาก: ไม่ว่าจะเกิดอะไรขึ้น ต้องหยุดโหลด!
      }
    };

    fetchData();
  }, [id, navigate]);

  // 🔄 Loading State: โชว์ Skeleton สวยๆ (แทนที่จะค้าง)
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto pb-20">
        <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  // 🚫 Error State: ถ้าโหลดเสร็จแล้วยังหาข้อมูลไม่เจอ
  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">ไม่พบข้อมูลร้านค้า</h2>
        <p className="text-gray-500 mb-6">ร้านที่คุณตามหาอาจถูกลบหรือไม่มีอยู่จริง</p>
        <button 
            onClick={() => navigate('/shops')} 
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          กลับไปเลือกร้านใหม่
        </button>
      </div>
    );
  }

  // ✅ Success State: แสดงผลปกติ
  return (
    <div className="space-y-6 pb-20 animate-[slideUp_0.6s_cubic-bezier(0.16,1,0.3,1)]">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {/* 🖼️ Header ร้านค้าแบบอลังการ */}
      <div className="relative bg-slate-900 rounded-[2rem] shadow-lg overflow-hidden group h-[280px] md:h-[360px] flex items-end">
        {/* Background Image (Blurred) */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:scale-105 transition-transform duration-[2s]"
          style={{ backgroundImage: `url(${shop.image_url || "https://placehold.co/600x200"})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

        <div className="relative p-6 md:p-12 flex flex-col md:flex-row items-end gap-6 w-full">
        <button 
            onClick={() => navigate('/shops')} 
            className="absolute top-4 left-4 md:top-6 md:left-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full shadow-lg z-10 text-white transition-all border border-white/10"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>

        <img 
          src={shop.image_url || "https://placehold.co/100"} 
          className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-xl border-2 border-white/10 bg-slate-800 shrink-0 hidden md:block"
        />
        
        <div className="text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
             <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><Star className="w-3 h-3 fill-current" /> 4.8</span>
             <span className="bg-green-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">Open Now</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-md">{shop.restaurant_name || "Unknown Restaurant"}</h1>
          <div className="flex flex-col md:flex-row gap-4 text-slate-300 text-sm justify-center md:justify-start font-medium">
            <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" /> 
                <span>{shop.address || "-"}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" /> 
                <span>{shop.phone || "-"}</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* รายการเมนู */}
      <div>
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Utensils className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">เมนูแนะนำ</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(menus) && menus.length > 0 ? (
            menus
                .filter(menu => menu && typeof menu === 'object') // 🛡️ กรองเมนูขยะทิ้ง
                .map((menu) => (
                <MenuCard 
                    key={menu.menu_id} 
                    data={menu} 
                    onAddToCart={(item) => {
                        addItemToCart(item);
                        // Optional: alert(`เพิ่ม ${item.menu_name} เรียบร้อย!`);
                    }}
                />
            ))
            ) : (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500">
                <ShoppingBag className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium text-gray-600 dark:text-slate-400">ร้านนี้ยังไม่มีเมนูอาหาร</p>
                <p className="text-sm opacity-70">แวะมาดูใหม่วันหลังนะ</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};
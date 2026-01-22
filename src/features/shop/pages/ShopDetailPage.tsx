// src/features/shop/pages/ShopDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MapPin } from 'lucide-react'; // เพิ่ม MapPin
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
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // ถ้าไม่มี ID ให้ดีดกลับหน้าแรกเลย ไม่ต้องโหลด
    if (!id || id === 'undefined') {
      navigate('/shops');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true); // เริ่มโหลด
      try {
        // 🛡️ ใช้ allSettled แทน all: เพื่อให้แยกกันรอดได้
        // ถ้าเมนูพัง แต่ร้านค้าโหลดได้ ก็ยังโชว์ร้านค้าได้ (ดีกว่าหน้าขาว)
        const results = await Promise.allSettled([
          getRestaurantById(id),
          getMenusByRestaurantId(id)
        ]);

        const shopResult = results[0];
        const menusResult = results[1];

        // เช็คผลลัพธ์ร้านค้า
        if (shopResult.status === 'fulfilled' && shopResult.value) {
            setShop(shopResult.value);
        } else {
            setIsError(true); // ถ้าร้านพัง คือจบข่าว
        }

        // เช็คผลลัพธ์เมนู (ถ้าพัง ก็แค่ไม่มีเมนูโชว์ ไม่ต้อง Error ทั้งหน้า)
        if (menusResult.status === 'fulfilled') {
            setMenus(menusResult.value);
        }
      } catch (error) {
        console.error("Error loading shop details:", error);
        setIsError(true);
      } finally {
        setIsLoading(false); // โหลดเสร็จแล้ว (ไม่ว่าจะสำเร็จหรือพัง)
      }
    };

    fetchData();
  }, [id, navigate]);

  // 1. Loading State: โชว์ Skeleton สวยๆ แทน Text ธรรมดา
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // 2. Error State: ถ้าหาไม่เจอจริงๆ
  if (isError || !shop) {
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* ปุ่มย้อนกลับ */}
        <button 
            onClick={() => navigate('/shops')} 
            className="absolute top-4 left-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm z-10 backdrop-blur-sm"
        >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>

        <img 
          src={shop.image_url || "https://placehold.co/100"} 
          className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md"
        />
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{shop.restaurant_name}</h1>
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500">
            <MapPin className="w-4 h-4" />
            <span>{shop.address}</span>
          </div>
          <p className="text-indigo-600 font-medium mt-2">{shop.phone}</p>
        </div>
      </div>

      {/* รายการเมนู */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">เมนูแนะนำ 🍽️</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menus.length > 0 ? (
            menus.map((menu) => (
                <MenuCard 
                key={menu.menu_id} 
                data={menu} 
                onAddToCart={(item) => {
                    addItemToCart(item);
                    // ใช้ Toast หรือ UI เล็กๆ แทน alert ก็ได้ถ้าอยากให้หรู (แต่ alert ก็โอเค)
                    // alert(`เพิ่ม ${item.menu_name} ลงตะกร้าแล้ว`); 
                }}
                />
            ))
            ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>ร้านนี้ยังไม่มีเมนูอาหาร</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};
// src/features/shop/pages/ShopDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { getRestaurantById, getMenusByRestaurantId } from '../api/shopService';
import type { Restaurant, Menu } from '../types';
import { MenuCard } from '../../menu/components/MenuCard';
import { useCartStore } from '../../../stores/useCartStore';

export const ShopDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [shopData, menusData] = await Promise.all([
          getRestaurantById(id),
          getMenusByRestaurantId(id)
        ]);
        setShop(shopData);
        setMenus(menusData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <div className="p-8 text-center">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-500" />
          </button>
          
          <img 
            src={shop?.image_url || "https://placehold.co/100"} 
            className="w-20 h-20 rounded-lg object-cover bg-gray-100"
          />
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{shop?.restaurant_name}</h1>
            <p className="text-slate-500">{shop?.address}</p>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menus.length > 0 ? (
          menus.map((menu) => (
            <MenuCard 
              key={menu.menu_id} 
              data={menu} 
              onAddToCart={(item) => {
                addItemToCart(item);
                alert(`เพิ่ม ${item.menu_name} ลงตะกร้าแล้ว 🛒`);
              }}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-20" />
            ยังไม่มีเมนู
          </div>
        )}
      </div>
    </div>
  );
};
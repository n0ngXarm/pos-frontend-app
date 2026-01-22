// src/features/admin/pages/AdminShopListPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Store } from 'lucide-react';
import { getRestaurants } from '../../shop/api/shopService';
import type { Restaurant } from '../../shop/types';

export const AdminShopListPage = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Restaurant[]>([]);

  useEffect(() => {
    getRestaurants().then(setShops);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🛠️ จัดการร้านค้า (Back Office)</h1>
          <p className="text-slate-500">จัดการข้อมูลร้านอาหารในระบบทั้งหมด</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> เพิ่มร้านใหม่
        </button>
      </div>

      {/* ตารางข้อมูล (Table View) - ดูเป็นมืออาชีพกว่าการ์ด */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">ID</th>
              <th className="p-4 font-semibold text-slate-700">ชื่อร้าน</th>
              <th className="p-4 font-semibold text-slate-700">ที่อยู่</th>
              <th className="p-4 font-semibold text-slate-700">เบอร์โทร</th>
              <th className="p-4 font-semibold text-slate-700 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shops.map((shop) => (
              <tr key={shop.restaurant_id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-slate-500">#{shop.restaurant_id}</td>
                <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                     <img src={shop.image_url} className="w-full h-full object-cover" />
                  </div>
                  {shop.restaurant_name}
                </td>
                <td className="p-4 text-slate-500 max-w-xs truncate">{shop.address}</td>
                <td className="p-4 text-slate-500">{shop.phone}</td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => navigate(`/admin/shops/${shop.restaurant_id}`)}
                    className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg"
                    title="จัดการเมนู"
                  >
                    <Store className="w-4 h-4" />
                  </button>
                  <button className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
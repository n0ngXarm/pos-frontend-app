// src/features/menu/components/MenuCard.tsx
import { Plus } from 'lucide-react';
import { type Menu } from '../../shop/types'; // ยืม Type มาจาก Shop ก่อน
const cn = (...inputs: Array<string | false | null | undefined>) => {
  return inputs.filter(Boolean).join(' ');
};

interface MenuCardProps {
  data: Menu;
  onAddToCart: (menu: Menu) => void;
}

export const MenuCard = ({ data, onAddToCart }: MenuCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-all">
      {/* รูปอาหาร */}
      <div className="h-40 overflow-hidden relative">
        <img 
          src={data.image_url || "https://placehold.co/400x300?text=No+Food"} 
          alt={data.menu_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* รายละเอียด */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-900 line-clamp-1">{data.menu_name}</h3>
          <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded text-sm">
            ฿{Number(data.price).toLocaleString()}
          </span>
        </div>
        
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
          {data.description}
        </p>

        <button 
          onClick={() => onAddToCart(data)}
          className="w-full mt-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg transition-colors active:scale-95"
        >
          <Plus className="w-4 h-4" />
          เพิ่มลงตะกร้า
        </button>
      </div>
    </div>
  );
};
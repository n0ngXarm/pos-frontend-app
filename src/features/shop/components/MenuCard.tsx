import { Plus } from 'lucide-react';
import type { Menu } from '../types';

interface MenuCardProps {
  data: Menu;
  onAddToCart: (item: Menu) => void;
}

export const MenuCard = ({ data, onAddToCart }: MenuCardProps) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group border border-gray-100">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={data.image_url || "https://placehold.co/400x300"} 
          alt={data.menu_name || "Menu"}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <p className="text-white text-sm font-medium line-clamp-2">{data.description || ""}</p>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-800 text-lg line-clamp-1 flex-1" title={data.menu_name || ""}>
            {data.menu_name || "Unknown"}
          </h3>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full shrink-0 ml-2">
            {Number(data.price || 0).toLocaleString()} ฿
          </span>
        </div>
        
        <button 
          onClick={() => onAddToCart(data)}
          className="w-full mt-3 bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-600 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add to Cart
        </button>
      </div>
    </div>
  );
};
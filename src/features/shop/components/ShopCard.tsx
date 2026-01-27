import { MapPin, Phone } from 'lucide-react';
import type { Restaurant } from '../types';

interface ShopCardProps {
  data: Restaurant;
  onClick: () => void;
}

export const ShopCard = ({ data, onClick }: ShopCardProps) => {
  if (!data) return null;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all group"
    >
      <div className="h-48 overflow-hidden">
        <img 
          src={data.image_url || "https://placehold.co/600x400?text=Restaurant"} 
          alt={data.restaurant_name || "Restaurant"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-slate-900 mb-1">{data.restaurant_name || "Unknown Restaurant"}</h3>
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{data.address || "No address"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Phone className="w-4 h-4" />
          <span>{data.phone || "No phone"}</span>
        </div>
      </div>
    </div>
  );
};
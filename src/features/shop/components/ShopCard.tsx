// src/features/shop/components/ShopCard.tsx
import { MapPin, Phone } from 'lucide-react';
import type { Restaurant } from '../types';
import { motion } from 'framer-motion';

interface ShopCardProps {
  data: Restaurant;
  onClick: () => void;
}

export const ShopCard = ({ data, onClick }: ShopCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }} // ลอยขึ้นนิดนึงเมื่อเอาเมาส์ชี้
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 group"
    >
      {/* รูปภาพร้าน */}
      <div className="h-48 overflow-hidden relative">
        <img
          src={data.image_url || "https://placehold.co/600x400?text=No+Image"} // กันเหนียวถ้ารูปไม่มี
          alt={data.restaurant_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* เนื้อหา */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">
          {data.restaurant_name}
        </h3>
        
        <div className="space-y-2 text-sm text-slate-500">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
            <span className="line-clamp-2">{data.address}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{data.phone}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
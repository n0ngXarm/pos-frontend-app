import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/use-auth-store';
import { getRestaurants } from '../api/shopService';
import { Loader2 } from 'lucide-react';

export const MyShopRedirect = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const findMyShop = async () => {
      if (!user) return;
      try {
        // 1. ดึงร้านค้าทั้งหมด
        const shops = await getRestaurants();
        
        // 2. หาร้านที่เป็นของ User คนนี้ (เช็คจาก owner_id)
        // หมายเหตุ: ต้องมั่นใจว่า Backend ส่ง owner_id มาด้วย หรือใช้ Logic นี้แก้ขัดไปก่อน
        const myShop = shops.find((s: any) => s.owner_id === Number(user.id));
        
        if (myShop) {
          // 3. เจอร้าน -> พาไปหน้า Dashboard (หน้ารวม)
          navigate(`/my-shop/dashboard`);
        } else {
          // 4. ไม่เจอร้าน -> พาไปหน้าสร้างร้านทันที (ไม่ต้องถาม)
          navigate('/register-shop'); 
        }
      } catch (error) {
        console.error("Error finding shop:", error);
        navigate('/shops');
      }
    };
    findMyShop();
  }, [user, navigate]);

  return (
    <div className="flex justify-center items-center min-h-[60vh] flex-col gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-900" />
      <span className="text-gray-500 font-medium">กำลังค้นหาร้านของคุณ...</span>
    </div>
  );
};
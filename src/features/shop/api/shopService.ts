// src/features/shop/api/shopService.ts
import { api } from '../../../lib/axios';
import type { Restaurant } from '../types';
import { type Menu } from '../types';

export const getRestaurants = async (): Promise<Restaurant[]> => {
  // ยิงไปที่ URL: /api/restaurants (ต้องเช็คกับ Swagger ว่า path นี้จริงมั้ย)
  const { data } = await api.get<Restaurant[]>('/restaurants'); 
  return data;
};

export const getRestaurantById = async (id: string): Promise<Restaurant> => {
  const { data } = await api.get<Restaurant>(`/restaurants/${id}`);
  return data;
};
export const getMenusByRestaurantId = async (restaurantId: string): Promise<Menu[]> => {
  // เดาว่า Backend น่าจะเก็บเมนูไว้ที่ /menus หรือ /restaurants/:id/menus
  // แต่จากตาราง Database มันมี tbl_menus แยกออกมา
  // ลองยิงไปที่ /menus แล้ว Filter เอาเองหน้าบ้านก่อน (เซฟสุดถ้ายิง backend ตรงๆ ไม่ได้)
  
  const { data } = await api.get<Menu[]>('/menus'); 
  
  // Filter เฉพาะเมนูของร้านนี้ (Client-side filtering เพราะไม่ชัวร์ API Backend)
  return data.filter(menu => menu.restaurant_id === Number(restaurantId));
};
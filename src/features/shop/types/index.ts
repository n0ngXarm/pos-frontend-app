// src/features/shop/types/index.ts

// 1. ตาราง tbl_restaurants
export interface Restaurant {
  restaurant_id: number;
  restaurant_name: string;
  address: string;
  phone: string;
  image_url: string;        // ใน DB เป็น LONGTEXT
  owner_description?: string; // ใน DB เห็นมี field นี้ด้วย
}

// 2. ตาราง tbl_menus (เตรียมไว้ก่อน)
export interface Menu {
  menu_id: number;
  restaurant_id: number;
  menu_name: string;
  description: string;
  price: number;            // DECIMAL
  image_url: string;
  category: string;
}

// Response เวลาดึง list ร้านค้า
export type RestaurantListResponse = Restaurant[];
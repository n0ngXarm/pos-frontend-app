// src/features/shop/types/index.ts
// ต้องมี export ทั้ง 3 ตัวนี้ ห้ามขาด!

export interface Restaurant {
  restaurant_id: number;
  restaurant_name: string;
  address: string;
  phone: string;
  image_url: string;
  owner_description?: string;
}

export interface Menu {
  menu_id: number;
  restaurant_id: number;
  menu_name: string;
  description: string;
  price: number;
  image_url: string;
  category?: string;
}

export type RestaurantListResponse = Restaurant[];
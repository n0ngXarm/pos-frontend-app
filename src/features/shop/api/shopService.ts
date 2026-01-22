// src/features/shop/api/shopService.ts
import { api } from '../../../lib/axios';
import type { Restaurant } from '../types';
import { type Menu } from '../types';

// 👇 เพิ่ม Interface สำหรับ Order Payload
export interface CreateOrderPayload {
  customer_id: number;
  restaurant_id: number;
  menu_id: number;
  quantity: number;
  total_price: number;
  order_status: string;
  order_date: string; // ส่งเป็น string ISO format
}

export const getRestaurants = async (): Promise<Restaurant[]> => {
  // ยิงไปที่ URL: /api/restaurants (ต้องเช็คกับ Swagger ว่า path นี้จริงมั้ย)
  const { data } = await api.get<Restaurant[]>('/restaurants'); 
  return data;
};

export const getRestaurantById = async (id: string): Promise<Restaurant | null> => {
  // 🛡️ ด่านตรวจ: ถ้า ID เป็น undefined, null หรือว่างเปล่า -> หยุดทันที!
  if (!id || id === 'undefined' || id === 'null') {
    return null;
  }

  try {
    const { data } = await api.get<Restaurant>(`/restaurants/${id}`);
    return data;
  } catch (error) {
    console.warn("⚠️ หาข้อมูลร้านไม่เจอ:", error);
    return null;
  }
};
export const getMenusByRestaurantId = async (restaurantId: string): Promise<Menu[]> => {
  // 🛡️ ด่านตรวจ
  if (!restaurantId || restaurantId === 'undefined' || restaurantId === 'null') {
    return []; // คืนค่าตระกร้าว่างๆ ไปเลย เร็วปรู๊ด!
  }

  try {
    // 🚀 ใช้สูตร Safe Fetch: ดึงมาทั้งหมดแล้วคัดเลือกหน้าบ้าน (ชัวร์สุดสำหรับตอนนี้)
    const { data } = await api.get<Menu[]>('/menus');
    
    // คัดเอาเฉพาะเมนูของร้านนี้
    return data.filter(menu => menu.restaurant_id === Number(restaurantId));
  } catch (error) {
    console.error("❌ โหลดเมนูไม่ได้:", error);
    return [];
  }
};

// 1. สร้างเมนูใหม่ (POST)
export const createMenu = async (menuData: Partial<Menu>): Promise<Menu> => {
  const { data } = await api.post<Menu>('/menus', menuData);
  return data;
};

// 2. แก้ไขเมนูเดิม (PUT)
export const updateMenu = async (menuId: number, menuData: Partial<Menu>): Promise<Menu> => {
  const { data } = await api.put<Menu>(`/menus/${menuId}`, menuData);
  return data;
};

// 3. ลบเมนู (DELETE)
export const deleteMenu = async (menuId: number): Promise<void> => {
  await api.delete(`/menus/${menuId}`);
};

// 👇 เพิ่มฟังก์ชันนี้ต่อท้ายสุด
export const createOrder = async (orderData: CreateOrderPayload) => {
  // ยิงไปที่ POST /orders (ตามหลัก REST API)
  const { data } = await api.post('/orders', orderData);
  return data;
};

// 👇 1. ดึงรายการออเดอร์ทั้งหมด (สำหรับ Admin)
export const getOrders = async () => {
  const { data } = await api.get('/orders');
  // หวังว่า Backend จะส่งข้อมูลที่ Join แล้วมา (เช่น ชื่อลูกค้า, ชื่อเมนู) 
  // แต่ถ้าส่งมาแค่ ID เดี๋ยวเราค่อยมาแก้หน้างานครับ
  return data;
};

// 👇 2. อัปเดตสถานะออเดอร์ (เช่น เปลี่ยนจาก pending -> completed)
export const updateOrderStatus = async (orderId: number, status: string) => {
  const { data } = await api.put(`/orders/${orderId}`, { order_status: status });
  return data;
};

// เพิ่มฟังก์ชันสร้าง PromptPay QR Code แบบ Real-time
// ใช้บริการของ promptpay.io (ง่ายและฟรี ไม่ต้องลง library เพิ่ม)
export const generatePromptPayQR = (phoneNumber: string, amount: number) => {
  return `https://promptpay.io/${phoneNumber}/${amount}.png`;
};
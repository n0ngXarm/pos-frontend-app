// src/features/shop/api/shopService.ts
import { api } from '../../../lib/axios';
import type { Restaurant, Menu } from '../types';

// 👇 เพิ่ม Interface สำหรับ Order Payload
export interface CreateOrderPayload {
  customer_id: number;
  restaurant_id: number;
  menu_id: number;
  quantity: number;
  total_price: number;
  order_status: string;
  order_date: string; // ส่งเป็น string ISO format
  payment_method?: string; // ✅ เพิ่ม: วิธีการชำระเงิน
  slip_url?: string | null; // ✅ เพิ่ม: ลิงก์สลิป
}

// ดึงร้านค้าทั้งหมด
export const getRestaurants = async (): Promise<Restaurant[]> => {
  const { data } = await api.get<Restaurant[]>('/restaurants'); 
  return data;
};

// 👇 สร้างร้านค้าใหม่ (สำหรับ User ที่อยากเป็นเจ้าของร้าน)
export const createRestaurant = async (restaurantData: Partial<Restaurant>) => {
  const { data } = await api.post<Restaurant>('/restaurants', restaurantData);
  return data;
};

// 👇 จุดแก้ที่ 1: เพิ่ม "ยามเฝ้าประตู"
export const getRestaurantById = async (id: number | string): Promise<Restaurant | null> => {
  // ถ้าไม่มีบัตร (ID เสีย) ห้ามผ่าน!
  if (!id || String(id) === 'undefined' || String(id) === 'null') {
    return null; 
  }

  try {
    const { data } = await api.get<Restaurant>(`/restaurants/${id}`);
    return data;
  } catch (error) {
    // ดัก Error เงียบๆ ไม่ต้องโวยวายให้ Console แดง
    return null;
  }
};

// 👇 จุดแก้ที่ 2: ดักตรงเมนูด้วย
export const getMenusByRestaurantId = async (restaurantId: number | string): Promise<Menu[]> => {
  if (!restaurantId || String(restaurantId) === 'undefined' || String(restaurantId) === 'null') {
    return []; // คืนจานเปล่าไปเลย เร็วปรู๊ด!
  }

  try {
    const { data } = await api.get<Menu[]>('/menus');
    // กรองเฉพาะของร้านนี้ (ท่าไม้ตายแก้ 404)
    return data.filter(menu => Number(menu.restaurant_id) === Number(restaurantId));
  } catch (error) {
    return [];
  }
};

// 1. สร้างเมนูใหม่ (POST)
export const createMenu = async (menuData: Partial<Menu>): Promise<Menu> => {
  const payload = {
    ...menuData,
    price: Number(menuData.price) || 0, // ✅ แปลงเป็นตัวเลขเสมอ
    restaurant_id: Number(menuData.restaurant_id)
  };
  const { data } = await api.post<Menu>('/menus', payload);
  return data;
};

// 2. แก้ไขเมนูเดิม (PUT)
export const updateMenu = async (menuId: number, menuData: Partial<Menu>): Promise<Menu> => {
  const payload = {
    ...menuData,
    price: Number(menuData.price) || 0 // ✅ แปลงเป็นตัวเลขเสมอ
  };
  const { data } = await api.put<Menu>(`/menus/${menuId}`, payload);
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

// 👇 ฟังก์ชันคำนวณ Checksum (CRC16) ตามมาตรฐาน PromptPay
function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
}

// 👇 ฟังก์ชันสร้างรหัส PromptPay (Payload Generator) - คำนวณเองไม่ง้อเว็บ!
export const generatePromptPayPayload = (target: string, amount: number) => {
  const targetClean = target.replace(/[^0-9]/g, '');
  let targetValue = '';
  let targetType = '01'; // 01=Mobile, 02=TaxID, 03=EWallet

  // ตรวจสอบว่าเป็น เบอร์โทร (10), บัตร ปชช (13), หรือ E-Wallet (15)
  if (targetClean.length >= 15) {
    targetValue = targetClean; // E-Wallet ID
    targetType = '03';
  } else if (targetClean.length >= 13) {
    targetValue = targetClean; // ID Card
    targetType = '02';
  } else if (targetClean.length === 10 && targetClean.startsWith('0')) {
    // เบอร์โทรศัพท์ปกติ: ตัด 0 หน้าสุดออก แล้วเติม 0066
    targetValue = '0066' + targetClean.substring(1); 
    targetType = '01';
  } else {
    // กรณีอื่นๆ (เช่น เลขบัญชี 173... หรือเบอร์ที่ลืมใส่ 0)
    // ให้เติม 0066 ไปเลยเพื่อให้โครงสร้าง QR ถูกต้อง (แอปธนาคารจะมองเป็นเบอร์มือถือ)
    targetValue = '0066' + targetClean;
    targetType = '01';
  }

  const targetLenStr = ('00' + targetValue.length).slice(-2);
  const tag29Value = '0016A000000677010111' + targetType + targetLenStr + targetValue;
  const tag29Len = ('00' + tag29Value.length).slice(-2);
  
  const amountStr = amount.toFixed(2);
  const amountLen = ('00' + amountStr.length).slice(-2);

  // ประกอบร่างตามมาตรฐาน EMVCo
  const payload = [
    '000201', // 00: Version
    '010211', // 01: Dynamic QR
    '29' + tag29Len + tag29Value, // 29: Merchant Info
    '5303764', // 53: Currency THB
    '54' + amountLen + amountStr, // 54: Amount
    '5802TH', // 58: Country
    '6304' // 63: CRC Placeholder
  ].join('');

  return payload + crc16(payload); // ต่อท้ายด้วย CRC ที่คำนวณได้
};

export const generatePromptPayQR = (phoneNumber: string, amount: number) => {
  // 1. คำนวณรหัส Payload เอง
  const payload = generatePromptPayPayload(phoneNumber, amount);
  
  // 2. ส่งรหัสไปแปลงเป็นรูปภาพ (ใช้ api.qrserver.com ซึ่งเสถียรกว่า promptpay.io มาก)
  // หมายเหตุ: ถ้าอยากทำแบบ Lazada เป๊ะๆ ต้องลง library 'qrcode' แล้วสั่ง QRCode.toDataURL(payload) ในคอมโพเนนต์ครับ
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
};
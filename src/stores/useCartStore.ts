// src/stores/useCartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// 👇 กลับมาใช้การ import (เช็คว่าไฟล์นี้มีอยู่จริงนะ!)
import type { Menu } from '../features/shop/types';

export interface CartItem extends Menu {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  restaurantId: number | null;
  addItem: (menu: Menu) => void;
  removeItem: (menuId: number) => void;
  updateQuantity: (menuId: number, change: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,

      addItem: (menu) => {
        const currentItems = get().items;
        const currentRestId = get().restaurantId;

        if (currentRestId && currentRestId !== menu.restaurant_id) {
          if (!confirm('คุณกำลังสั่งอาหารจากร้านใหม่ ตะกร้าเดิมจะถูกล้าง ยืนยันไหม?')) return;
          set({ items: [], restaurantId: null });
        }

        const existingItem = currentItems.find(item => item.menu_id === menu.menu_id);

        if (existingItem) {
          set({
            items: currentItems.map(item => 
              item.menu_id === menu.menu_id 
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
            restaurantId: menu.restaurant_id
          });
        } else {
          set({
            items: [...currentItems, { ...menu, quantity: 1 }],
            restaurantId: menu.restaurant_id
          });
        }
      },

      removeItem: (menuId) => {
        set(state => ({
          items: state.items.filter(item => item.menu_id !== menuId),
          restaurantId: state.items.length === 1 ? null : state.restaurantId 
        }));
      },

      updateQuantity: (menuId, change) => {
        set(state => ({
          items: state.items.map(item => {
            if (item.menu_id === menuId) {
              const newQty = item.quantity + change;
              return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
          })
        }));
      },

      clearCart: () => set({ items: [], restaurantId: null }),

      getTotalPrice: () => get().items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0)
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
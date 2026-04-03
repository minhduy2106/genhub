'use client';
import { create } from 'zustand';

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  discount: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  setCustomer: (id: string | null, name: string | null, phone?: string | null) => void;
  setDiscount: (amount: number) => void;
  clear: () => void;
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  customerName: null,
  customerPhone: null,
  discount: 0,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId,
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId && i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (productId, variantId) =>
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.productId === productId && i.variantId === variantId),
      ),
    })),

  updateQuantity: (productId, quantity, variantId) =>
    set((state) => ({
      items: quantity <= 0
        ? state.items.filter((i) => !(i.productId === productId && i.variantId === variantId))
        : state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i,
          ),
    })),

  setCustomer: (id, name, phone = null) => set({ customerId: id, customerName: name, customerPhone: phone }),
  setDiscount: (amount) => set({ discount: amount }),
  clear: () => set({ items: [], customerId: null, customerName: null, customerPhone: null, discount: 0 }),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  total: () => get().subtotal() - get().discount,
}));

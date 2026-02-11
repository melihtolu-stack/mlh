/**
 * Zustand Cart Store - Sepet yönetimi için global state
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId?: string;
  productName: string;
  productSku?: string;
  variantName?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice?: number;
  category?: string;
}

interface CartState {
  items: CartItem[];
  sessionId: string;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  
  // Getters
  getTotalItems: () => number;
  getTotalQuantity: () => number;
  getItem: (productId: string, variantId?: string) => CartItem | undefined;
  
  // Session
  setSessionId: (id: string) => void;
}

// Session ID oluştur (eğer yoksa)
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: generateSessionId(),
      
      addItem: (item: CartItem) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );
          
          if (existingItemIndex > -1) {
            // Mevcut ürünü güncelle
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += item.quantity;
            return { items: newItems };
          } else {
            // Yeni ürün ekle
            return { items: [...state.items, item] };
          }
        });
      },
      
      removeItem: (productId: string, variantId?: string) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.variantId === variantId)
          ),
        }));
      },
      
      updateQuantity: (productId: string, quantity: number, variantId?: string) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalItems: () => {
        return get().items.length;
      },
      
      getTotalQuantity: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getItem: (productId: string, variantId?: string) => {
        return get().items.find(
          (item) => item.productId === productId && item.variantId === variantId
        );
      },
      
      setSessionId: (id: string) => {
        set({ sessionId: id });
      },
    }),
    {
      name: 'mlh-cart-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

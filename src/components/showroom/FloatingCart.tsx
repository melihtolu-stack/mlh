'use client';

/**
 * Floating Cart Widget - Sağ alt köşede sabit duran mini sepet
 * Tıklandığında sepet drawer'ı açılır
 */

import { ShoppingCart, X } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function FloatingCart() {
  const { items, getTotalItems, getTotalQuantity, removeItem } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const router = useRouter();
  
  // Client-side'da güncelle (hydration hatası önlemek için)
  useEffect(() => {
    setCartCount(getTotalItems());
    setTotalQty(getTotalQuantity());
  }, [getTotalItems, getTotalQuantity, items]);
  
  const handleGoToCart = () => {
    setIsOpen(false);
    router.push('/showroom/cart');
  };
  
  if (cartCount === 0) {
    return null; // Sepet boşsa gösterme
  }
  
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 group"
        aria-label="Sepeti Aç"
      >
        <div className="relative">
          {/* Ana buton */}
          <div className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110">
            <ShoppingCart className="w-6 h-6" />
          </div>
          
          {/* Badge */}
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        </div>
      </button>
      
      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Sepetim ({cartCount} ürün)
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || 'default'}`}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              {/* Görsel */}
              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Bilgiler */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {item.productName}
                </h3>
                {item.productSku && (
                  <p className="text-xs text-gray-500 font-mono">
                    {item.productSku}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  Miktar: <span className="font-semibold">{item.quantity}</span>
                </p>
              </div>
              
              {/* Kaldır */}
              <button
                onClick={() => removeItem(item.productId, item.variantId)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Kaldır"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Toplam Miktar:</span>
            <span className="font-bold text-gray-900">{totalQty} adet</span>
          </div>
          
          <button
            onClick={handleGoToCart}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Sepete Git ve Teklif Al
          </button>
        </div>
      </div>
    </>
  );
}

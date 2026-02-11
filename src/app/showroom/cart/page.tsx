'use client';

/**
 * Sepetim Sayfası - Yeni tasarım
 * Sol: Sepet listesi (%60), Sağ: Teklif formu (%40)
 */

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import QuantitySelector from '@/components/showroom/QuantitySelector';
import QuoteRequestForm from '@/components/showroom/QuoteRequestForm';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalItems, getTotalQuantity } = useCartStore();
  const [mounted, setMounted] = useState(false);
  
  // Client-side'da mount edildiğinde göster (hydration hatası önlemek için)
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  
  const totalItems = getTotalItems();
  const totalQuantity = getTotalQuantity();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/showroom"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Alışverişe Devam Et</span>
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900">
          Sepetim
        </h1>
        <p className="text-gray-600 mt-2">
          {totalItems} ürün, toplam {totalQuantity} adet
        </p>
      </div>
      
      {items.length === 0 ? (
        /* Boş Sepet */
        <div className="text-center py-16">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Sepetiniz Boş
          </h2>
          <p className="text-gray-600 mb-6">
            Ürün eklemek için showroom'u ziyaret edin
          </p>
          <Link
            href="/showroom"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Ürünleri Keşfet</span>
          </Link>
        </div>
      ) : (
        /* Sepet İçeriği */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Sol: Sepet Listesi */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 'default'}`}
                className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  {/* Görsel */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Bilgiler */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.productName}
                    </h3>
                    
                    {item.productSku && (
                      <p className="text-xs text-gray-500 font-mono mb-2">
                        SKU: {item.productSku}
                      </p>
                    )}
                    
                    {item.variantName && (
                      <p className="text-sm text-gray-600 mb-2">
                        Varyant: {item.variantName}
                      </p>
                    )}
                    
                    {item.category && (
                      <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                  
                  {/* Miktar ve Kaldır */}
                  <div className="flex flex-col items-end space-y-3">
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Sepetten Kaldır"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(newQty) => updateQuantity(item.productId, newQty, item.variantId)}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Sağ: Teklif Formu */}
          <QuoteRequestForm
            totalItems={totalItems}
            totalQuantity={totalQuantity}
          />
        </div>
      )}
    </div>
  );
}

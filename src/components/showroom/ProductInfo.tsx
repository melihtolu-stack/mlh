'use client';

/**
 * Product Info - Ürün bilgileri ve sepete ekleme
 * Sağ tarafta gösterilir
 */

import { useState } from 'react';
import { Package, ShoppingCart, Check } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import QuantitySelector from './QuantitySelector';
import toast from 'react-hot-toast';
import { Product } from '@/lib/api/showroom';

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const { addItem, getItem } = useCartStore();
  const [quantity, setQuantity] = useState(product.moq || 1);
  
  const cartItem = getItem(product.id);
  const isInCart = !!cartItem;
  
  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      imageUrl: product.media?.[0]?.media_url,
      quantity,
      category: product.category,
    });
    
    toast.success('Ürün sepete eklendi!');
  };
  
  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {product.name}
        </h1>
        
        {/* SKU ve Kategori */}
        <div className="flex flex-wrap items-center gap-3">
          {product.sku && (
            <span className="text-sm text-gray-500 font-mono">
              SKU: {product.sku}
            </span>
          )}
          
          {product.category && (
            <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full">
              {product.category}
            </span>
          )}
          
          {product.brand && (
            <span className="inline-block px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
              {product.brand}
            </span>
          )}
        </div>
      </div>
      
      {/* Kısa Açıklama */}
      {product.short_description && (
        <p className="text-gray-600 leading-relaxed">
          {product.short_description}
        </p>
      )}
      
      {/* MOQ */}
      {product.moq && (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
          <Package className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Minimum Sipariş Miktarı (MOQ)
            </p>
            <p className="text-lg font-bold text-blue-600">
              {product.moq} adet
            </p>
          </div>
        </div>
      )}
      
      {/* Miktar Seçici */}
      <div className="border-t border-gray-200 pt-6">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Miktar Seçin
        </label>
        
        <div className="flex items-center space-x-4">
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={product.moq || 1}
            size="lg"
          />
          
          {isInCart && (
            <div className="flex items-center space-x-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">
                Sepette: {cartItem.quantity} adet
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
      >
        <ShoppingCart className="w-5 h-5" />
        <span>Sepete Ekle</span>
      </button>
      
      {/* Özellikler */}
      {product.features && product.features.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Özellikler
          </h3>
          
          <ul className="space-y-2">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

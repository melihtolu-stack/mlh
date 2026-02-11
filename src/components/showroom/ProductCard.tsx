'use client';

/**
 * Product Card - Ürün kartı component
 * Showroom ana sayfasında kullanılır
 */

import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import QuantitySelector from './QuantitySelector';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  short_description?: string;
  category?: string;
  image_url?: string;
  moq?: number;
}

export default function ProductCard({
  id,
  name,
  slug,
  sku,
  short_description,
  category,
  image_url,
  moq,
}: ProductCardProps) {
  const { addItem, updateQuantity, getItem } = useCartStore();
  const [quantity, setQuantity] = useState(0);
  
  // Sepetteki mevcut miktarı al
  useEffect(() => {
    const item = getItem(id);
    setQuantity(item?.quantity || 0);
  }, [id, getItem]);
  
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    
    if (newQuantity === 0) {
      // Sepetten kaldır
      updateQuantity(id, 0);
      toast.success('Ürün sepetten kaldırıldı');
    } else {
      // Sepete ekle veya güncelle
      const existingItem = getItem(id);
      
      if (existingItem) {
        updateQuantity(id, newQuantity);
        toast.success('Sepet güncellendi');
      } else {
        addItem({
          productId: id,
          productName: name,
          productSku: sku,
          imageUrl: image_url,
          quantity: newQuantity,
          category,
        });
        toast.success('Ürün sepete eklendi');
      }
    }
  };
  
  return (
    <div className="group bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Ürün Görseli */}
      <Link href={`/showroom/${slug}`} className="block relative aspect-square overflow-hidden bg-gray-100">
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}
        
        {/* Kategori Badge */}
        {category && (
          <div className="absolute top-3 left-3">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
              {category}
            </span>
          </div>
        )}
        
        {/* Sepet Badge */}
        {quantity > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold text-white bg-green-500 rounded-full shadow-lg">
              {quantity}
            </span>
          </div>
        )}
      </Link>
      
      {/* Ürün Bilgileri */}
      <div className="p-4 space-y-3">
        {/* Ürün Adı */}
        <Link href={`/showroom/${slug}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
            {name}
          </h3>
        </Link>
        
        {/* SKU */}
        {sku && (
          <p className="text-xs text-gray-500 font-mono">
            SKU: {sku}
          </p>
        )}
        
        {/* Kısa Açıklama */}
        {short_description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {short_description}
          </p>
        )}
        
        {/* MOQ */}
        {moq && (
          <p className="text-xs text-gray-500">
            MOQ: <span className="font-semibold">{moq} adet</span>
          </p>
        )}
        
        {/* Miktar Seçici */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Miktar:</span>
            <QuantitySelector
              value={quantity}
              onChange={handleQuantityChange}
              size="sm"
            />
          </div>
        </div>
        
        {/* View Details Button */}
        <Link
          href={`/showroom/${slug}`}
          className="block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors duration-200"
        >
          Detayları Gör
        </Link>
      </div>
    </div>
  );
}

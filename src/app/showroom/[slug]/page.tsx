'use client';

/**
 * Ürün Detay Sayfası - Yeni tasarım
 * Sol: Galeri, Sağ: Bilgiler, Alt: Tabs
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showroomAPI, Product } from '@/lib/api/showroom';
import ProductGallery from '@/components/showroom/ProductGallery';
import ProductInfo from '@/components/showroom/ProductInfo';
import ProductTabs from '@/components/showroom/ProductTabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadProduct();
  }, [slug]);
  
  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await showroomAPI.getProduct(slug);
      setProduct(data);
    } catch (err: any) {
      console.error('Ürün yüklenemedi:', err);
      setError(err.message || 'Ürün bulunamadı');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          {/* Back button skeleton */}
          <div className="h-10 w-32 bg-gray-200 rounded" />
          
          {/* Main content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-20 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ürün Bulunamadı
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/showroom"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ürünlere Dön</span>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/showroom"
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Ürünlere Dön</span>
      </Link>
      
      {/* Main Content: Gallery + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Sol: Galeri */}
        <ProductGallery
          media={product.media || []}
          productName={product.name}
        />
        
        {/* Sağ: Bilgiler */}
        <ProductInfo product={product} />
      </div>
      
      {/* Tabs */}
      <ProductTabs product={product} />
    </div>
  );
}

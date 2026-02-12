export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  status: 'draft' | 'active' | 'inactive';
  base_price?: number;
  currency?: string;
  manage_stock: boolean;
  stock_quantity: number;
  wc_product_id?: number;
  wc_synced_at?: string;
  created_at: string;
  updated_at: string;
  
  // İlişkiler (JOIN ile gelecek)
  product_media?: ProductMedia[];
  product_variants?: ProductVariant[];
  categories?: ProductCategory[];
}

export interface ProductMedia {
  id: string;
  product_id: string;
  media_type: 'image' | 'video' | 'document' | 'certificate';
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  title?: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  attributes?: Record<string, string>;
  price?: number;
  compare_at_price?: number;
  stock_quantity: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  wc_variation_id?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  wc_category_id?: number;
  created_at: string;
  updated_at: string;
}

// Helper function: İlk resmi getir
export function getProductImage(product: Product): string | null {
  if (!product.product_media || product.product_media.length === 0) {
    return null;
  }
  
  // Primary olanı bul
  const primaryImage = product.product_media.find(m => m.is_primary && m.media_type === 'image');
  if (primaryImage) return primaryImage.file_url;
  
  // Yoksa ilk image'i al
  const firstImage = product.product_media.find(m => m.media_type === 'image');
  return firstImage?.file_url || null;
}
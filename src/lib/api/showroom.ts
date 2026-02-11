/**
 * Showroom API client - Backend ile iletişim
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-mlh.heni.com.tr';

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  short_description?: string;
  description?: string;
  category?: string;
  brand?: string;
  is_active: boolean;
  moq?: number;
  image_url?: string;
  technical_specs?: Record<string, any>;
  features?: string[];
  media?: ProductMedia[];
  documents?: ProductDocument[];
  export_countries?: ExportCountry[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductMedia {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  media_category?: 'product' | 'loading' | 'certificate' | 'technical' | 'lifestyle';
  display_order: number;
}

export interface ProductDocument {
  id: string;
  document_type: 'msds' | 'coa' | 'analysis_report' | 'certificate' | 'spec_sheet' | 'other';
  title: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  language: string;
}

export interface ExportCountry {
  id: string;
  country_code: string;
  country_name: string;
  flag_url?: string;
  compliance_notes?: string;
  hs_code?: string;
  display_order: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product_name: string;
  product_sku?: string;
  product_image_url?: string;
  variant_name?: string;
  unit_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  session_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface QuoteRequest {
  cart_id?: string;
  items: {
    product_id: string;
    variant_id?: string;
    quantity: number;
  }[];
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  notes?: string;
}

export interface QuoteResponse {
  id: string;
  quote_number: string;
  status: string;
  created_at: string;
  message: string;
}

// API fonksiyonları
export const showroomAPI = {
  // Ürünleri listele
  async getProducts(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/showroom/products?${queryParams}`);
    if (!response.ok) throw new Error('Ürünler yüklenemedi');
    return response.json();
  },
  
  // Ürün detayını getir
  async getProduct(slug: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/api/showroom/products/${slug}`);
    if (!response.ok) throw new Error('Ürün bulunamadı');
    return response.json();
  },
  
  // Sepeti getir
  async getCart(sessionId: string): Promise<Cart> {
    const response = await fetch(`${API_BASE_URL}/api/showroom/cart/${sessionId}`);
    if (!response.ok) throw new Error('Sepet yüklenemedi');
    return response.json();
  },
  
  // Sepete ürün ekle
  async addToCart(sessionId: string, item: {
    product_id: string;
    variant_id?: string;
    quantity: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/showroom/cart/${sessionId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Ürün eklenemedi');
    return response.json();
  },
  
  // Sepet ürünü güncelle
  async updateCartItem(itemId: string, quantity: number) {
    const response = await fetch(`${API_BASE_URL}/api/showroom/cart/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Ürün güncellenemedi');
    return response.json();
  },
  
  // Sepetten ürün kaldır
  async removeFromCart(itemId: string) {
    const response = await fetch(`${API_BASE_URL}/api/showroom/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Ürün kaldırılamadı');
    return response.json();
  },
  
  // Teklif talebi oluştur
  async createQuote(quoteData: QuoteRequest): Promise<QuoteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/showroom/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData),
    });
    if (!response.ok) throw new Error('Teklif talebi gönderilemedi');
    return response.json();
  },
};

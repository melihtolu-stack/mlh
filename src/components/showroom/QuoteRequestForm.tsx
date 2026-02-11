'use client';

/**
 * Quote Request Form - Teklif talebi formu
 * Firma bilgileri ve iletişim formu
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Loader2 } from 'lucide-react';
import { showroomAPI } from '@/lib/api/showroom';
import { useCartStore } from '@/lib/stores/useCartStore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Validation schema
const quoteSchema = z.object({
  company_name: z.string().min(2, 'Firma adı en az 2 karakter olmalı'),
  contact_person: z.string().min(2, 'İletişim kişisi en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  phone: z.string().min(5, 'Telefon numarası en az 5 karakter olmalı'),
  country: z.string().min(2, 'Ülke en az 2 karakter olmalı'),
  notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteRequestFormProps {
  totalItems: number;
  totalQuantity: number;
}

export default function QuoteRequestForm({ totalItems, totalQuantity }: QuoteRequestFormProps) {
  const router = useRouter();
  const { items, sessionId, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
  });
  
  const onSubmit = async (data: QuoteFormData) => {
    if (items.length === 0) {
      toast.error('Sepetiniz boş!');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // API'ye gönderilecek formata çevir
      const quoteData = {
        ...data,
        items: items.map(item => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
      };
      
      const response = await showroomAPI.createQuote(quoteData);
      
      // Başarılı
      toast.success(
        `Teklif talebiniz alındı! Quote No: ${response.quote_number}`,
        { duration: 5000 }
      );
      
      // Sepeti temizle
      clearCart();
      
      // Formu sıfırla
      reset();
      
      // Ana sayfaya yönlendir
      setTimeout(() => {
        router.push('/showroom');
      }, 2000);
      
    } catch (error: any) {
      console.error('Teklif talebi hatası:', error);
      toast.error(error.message || 'Teklif talebi gönderilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sticky top-24">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Teklif Talebi Formu
      </h2>
      
      {/* Özet */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Toplam Ürün:</span>
          <span className="font-bold text-gray-900">{totalItems}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Toplam Miktar:</span>
          <span className="font-bold text-gray-900">{totalQuantity} adet</span>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Firma Adı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Firma Adı <span className="text-red-500">*</span>
          </label>
          <input
            {...register('company_name')}
            type="text"
            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.company_name ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="ABC Company Ltd."
          />
          {errors.company_name && (
            <p className="mt-1 text-xs text-red-600">{errors.company_name.message}</p>
          )}
        </div>
        
        {/* İletişim Kişisi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            İletişim Kişisi <span className="text-red-500">*</span>
          </label>
          <input
            {...register('contact_person')}
            type="text"
            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.contact_person ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="John Doe"
          />
          {errors.contact_person && (
            <p className="mt-1 text-xs text-red-600">{errors.contact_person.message}</p>
          )}
        </div>
        
        {/* E-posta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-posta <span className="text-red-500">*</span>
          </label>
          <input
            {...register('email')}
            type="email"
            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        {/* Telefon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon <span className="text-red-500">*</span>
          </label>
          <input
            {...register('phone')}
            type="tel"
            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="+1 234 567 8900"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>
        
        {/* Ülke */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ülke <span className="text-red-500">*</span>
          </label>
          <input
            {...register('country')}
            type="text"
            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.country ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="United States"
          />
          {errors.country && (
            <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>
          )}
        </div>
        
        {/* Notlar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Özel Notlar (Opsiyonel)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Özel talepleriniz veya notlarınız..."
          />
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Gönderiliyor...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Teklif Talebi Gönder</span>
            </>
          )}
        </button>
        
        {items.length === 0 && (
          <p className="text-xs text-center text-red-600">
            Sepetinizde ürün bulunmuyor
          </p>
        )}
      </form>
    </div>
  );
}

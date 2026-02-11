'use client';

/**
 * Product Tabs - 5 sekmeli ürün detay bilgileri
 * 1. Açıklama, 2. Teknik Bilgiler, 3. Belgeler, 4. Medya, 5. İhracat Bilgileri
 */

import { useState } from 'react';
import { FileText, Settings, FileCheck, Image as ImageIcon, Globe, Download, ExternalLink } from 'lucide-react';
import { Product } from '@/lib/api/showroom';
import Image from 'next/image';

interface ProductTabsProps {
  product: Product;
}

type TabId = 'description' | 'technical' | 'documents' | 'media' | 'export';

export default function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('description');
  
  const tabs = [
    { id: 'description' as TabId, label: 'Açıklama', icon: FileText },
    { id: 'technical' as TabId, label: 'Teknik Bilgiler', icon: Settings },
    { id: 'documents' as TabId, label: 'Belgeler', icon: FileCheck },
    { id: 'media' as TabId, label: 'Medya', icon: ImageIcon },
    { id: 'export' as TabId, label: 'İhracat Bilgileri', icon: Globe },
  ];
  
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b-2 border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-6 py-4 font-medium text-sm whitespace-nowrap
                transition-colors duration-200 border-b-2 -mb-0.5
                ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'description' && <DescriptionTab product={product} />}
        {activeTab === 'technical' && <TechnicalTab product={product} />}
        {activeTab === 'documents' && <DocumentsTab product={product} />}
        {activeTab === 'media' && <MediaTab product={product} />}
        {activeTab === 'export' && <ExportTab product={product} />}
      </div>
    </div>
  );
}

// Tab 1: Açıklama
function DescriptionTab({ product }: { product: Product }) {
  return (
    <div className="prose max-w-none">
      {product.description ? (
        <div dangerouslySetInnerHTML={{ __html: product.description }} />
      ) : (
        <p className="text-gray-500">Ürün açıklaması bulunmuyor.</p>
      )}
    </div>
  );
}

// Tab 2: Teknik Bilgiler
function TechnicalTab({ product }: { product: Product }) {
  if (!product.technical_specs || Object.keys(product.technical_specs).length === 0) {
    return <p className="text-gray-500">Teknik bilgi bulunmuyor.</p>;
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody className="divide-y divide-gray-200">
          {Object.entries(product.technical_specs).map(([key, value]) => (
            <tr key={key} className="hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900 w-1/3">
                {key}
              </td>
              <td className="py-3 px-4 text-gray-700">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Tab 3: Belgeler
function DocumentsTab({ product }: { product: Product }) {
  if (!product.documents || product.documents.length === 0) {
    return <p className="text-gray-500">Belge bulunmuyor.</p>;
  }
  
  const documentTypes: Record<string, string> = {
    msds: 'MSDS',
    coa: 'COA',
    analysis_report: 'Analiz Raporu',
    certificate: 'Sertifika',
    spec_sheet: 'Teknik Döküman',
    other: 'Diğer',
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {product.documents.map((doc) => (
        <div
          key={doc.id}
          className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{doc.title}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {documentTypes[doc.document_type] || doc.document_type}
                {doc.file_size && ` • ${(doc.file_size / 1024 / 1024).toFixed(2)} MB`}
              </p>
            </div>
            
            <FileCheck className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex items-center space-x-2 mt-3">
            <a
              href={doc.file_url}
              download
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>İndir</span>
            </a>
            
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
              aria-label="Önizle"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// Tab 4: Medya
function MediaTab({ product }: { product: Product }) {
  if (!product.media || product.media.length === 0) {
    return <p className="text-gray-500">Medya dosyası bulunmuyor.</p>;
  }
  
  // Kategorilere göre grupla
  const mediaByCategory = product.media.reduce((acc, media) => {
    const category = media.media_category || 'product';
    if (!acc[category]) acc[category] = [];
    acc[category].push(media);
    return acc;
  }, {} as Record<string, typeof product.media>);
  
  const categoryLabels: Record<string, string> = {
    product: 'Ürün Görselleri',
    loading: 'Yükleme Fotoğrafları',
    certificate: 'Sertifika Görselleri',
    technical: 'Teknik Görseller',
    lifestyle: 'Kullanım Görselleri',
  };
  
  return (
    <div className="space-y-8">
      {Object.entries(mediaByCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {categoryLabels[category] || category}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((media) => (
              <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors">
                {media.media_type === 'image' ? (
                  <Image
                    src={media.media_url}
                    alt={`${category} media`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <video
                    src={media.media_url}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Tab 5: İhracat Bilgileri
function ExportTab({ product }: { product: Product }) {
  if (!product.export_countries || product.export_countries.length === 0) {
    return <p className="text-gray-500">İhracat bilgisi bulunmuyor.</p>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          İhracat Yapılan Ülkeler
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {product.export_countries.map((country) => (
            <div
              key={country.id}
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              title={country.compliance_notes || ''}
            >
              {country.flag_url ? (
                <img
                  src={country.flag_url}
                  alt={country.country_name}
                  className="w-12 h-8 object-cover rounded shadow-sm mb-2"
                />
              ) : (
                <div className="w-12 h-8 bg-gray-200 rounded mb-2 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-gray-400" />
                </div>
              )}
              
              <span className="text-sm font-medium text-gray-900 text-center">
                {country.country_name}
              </span>
              
              {country.hs_code && (
                <span className="text-xs text-gray-500 mt-1">
                  HS: {country.hs_code}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Compliance Notes */}
      {product.export_countries.some(c => c.compliance_notes) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ülke Bazlı Notlar
          </h3>
          
          <div className="space-y-3">
            {product.export_countries
              .filter(c => c.compliance_notes)
              .map((country) => (
                <div key={country.id} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {country.country_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {country.compliance_notes}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

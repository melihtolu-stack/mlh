/**
 * Showroom Layout - Tüm showroom sayfaları için ortak layout
 * Header ve FloatingCart widget'ini içerir
 */

import ShowroomHeader from '@/components/showroom/ShowroomHeader';
import FloatingCart from '@/components/showroom/FloatingCart';
import { Toaster } from 'react-hot-toast';

export default function ShowroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ShowroomHeader />
      
      {/* Main Content */}
      <main>{children}</main>
      
      {/* Floating Cart Widget */}
      <FloatingCart />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

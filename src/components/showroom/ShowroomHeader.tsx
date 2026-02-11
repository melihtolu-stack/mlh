'use client';

/**
 * Showroom Header - Sticky navigation header
 * Sol: Anasayfa, Ürünler, Sepetim
 * Orta: Logo/Arama (opsiyonel)
 * Sağ: Heni logo (grileştirilmiş)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Home, Package } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useEffect, useState } from 'react';

export default function ShowroomHeader() {
  const pathname = usePathname();
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Cart count'u client-side'da güncelle (hydration hatası önlemek için)
  useEffect(() => {
    setCartCount(getTotalItems());
  }, [getTotalItems]);
  
  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navLinks = [
    { href: '/', label: 'Anasayfa', icon: Home },
    { href: '/showroom', label: 'Ürünler', icon: Package },
    { href: '/showroom/cart', label: 'Sepetim', icon: ShoppingCart, badge: cartCount },
  ];
  
  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Sol: Navigation */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                  
                  {/* Badge (sepet için) */}
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Orta: Logo/Marka (opsiyonel) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            <Link href="/showroom" className="text-xl font-bold text-gray-800">
              MLH Showroom
            </Link>
          </div>
          
          {/* Sağ: Heni Logo */}
          <div className="flex items-center">
            <span className="text-sm text-gray-400 font-medium">
              Powered by{' '}
              <span className="font-bold text-gray-500">Heni</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

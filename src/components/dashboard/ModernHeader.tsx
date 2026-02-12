'use client';

/**
 * Modern CRM Header - Showroom stilinde
 * Dashboard için sticky navigation header
 */

import { useAuth } from '@/contexts/AuthContext';
import { Power, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface ModernHeaderProps {
  onMenuToggle?: () => void;
}

export default function ModernHeader({ onMenuToggle }: ModernHeaderProps) {
  const { signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white border-b border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Sol: Logo ve Menü */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <span className="text-xl">💼</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">MLH CRM</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Bilgi Yönetim Sistemi</p>
              </div>
            </Link>
          </div>

          {/* Sağ: Actions */}
          <div className="flex items-center space-x-2">
            {/* Showroom Link */}
            <Link
              href="/showroom"
              target="_blank"
              className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>🛍️</span>
              <span>Showroom</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={() => signOut()}
              className="p-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              title="Çıkış Yap"
            >
              <Power size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import BottomNav from './BottomNav'

const PUBLIC_ROUTES = ['/login', '/showroom']

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`))
    if (!loading && !user && !isPublic) {
      router.push('/login')
    }
  }, [user, loading, router, pathname])

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // If not logged in and not on login page, don't render anything (will redirect)
  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`))

  if (!user && !isPublic) {
    return null
  }

  // If on public pages, render without auth chrome
  if (isPublic) {
    return <>{children}</>
  }

  // Render with bottom nav for authenticated users (no sidebar)
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}

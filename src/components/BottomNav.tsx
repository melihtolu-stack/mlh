"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Truck, TrendingUp } from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

export default function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href)
  }

  const navItems: NavItem[] = [
    { 
      name: "Müşteriler", 
      href: "/", 
      icon: <Users className={`${isActive("/") ? "text-primary" : "text-gray-400"}`} size={24} strokeWidth={2.5} />
    },
    { 
      name: "Tedarikçiler", 
      href: "/suppliers", 
      icon: <Truck className={`${isActive("/suppliers") ? "text-primary" : "text-gray-400"}`} size={24} strokeWidth={2.5} />
    },
    { 
      name: "Finans", 
      href: "/finance", 
      icon: <TrendingUp className={`${isActive("/finance") ? "text-primary" : "text-gray-400"}`} size={24} strokeWidth={2.5} />
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative group ${
              isActive(item.href)
                ? "text-primary"
                : "text-gray-400 hover:text-primary"
            }`}
          >
            {isActive(item.href) && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-primary rounded-b-full shadow-sm"></div>
            )}
            <div className={`mb-1 transition-transform group-hover:scale-110 ${isActive(item.href) ? 'scale-110' : ''}`}>
              {item.icon}
            </div>
            <span className={`text-xs font-semibold ${isActive(item.href) ? 'text-primary' : 'text-gray-500'}`}>
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

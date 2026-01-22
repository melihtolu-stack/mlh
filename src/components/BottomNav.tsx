"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItem {
  name: string
  href: string
  icon: string
}

const navItems: NavItem[] = [
  { name: "Müşteriler", href: "/", icon: "👥" },
  { name: "Tedarikçiler", href: "/suppliers", icon: "🏭" },
  { name: "Finans", href: "/finance", icon: "💰" },
]

export default function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
              isActive(item.href)
                ? "text-primary"
                : "text-secondary hover:text-primary"
            }`}
          >
            {isActive(item.href) && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"></div>
            )}
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-semibold">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

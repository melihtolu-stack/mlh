"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, Inbox, LayoutGrid } from "lucide-react"

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutGrid },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Quotes", href: "/dashboard/quotes", icon: Inbox },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="h-16 px-6 flex items-center border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

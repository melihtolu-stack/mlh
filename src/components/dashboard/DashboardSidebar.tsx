"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, Inbox, LayoutGrid, Users, Building2, TrendingUp, MessageSquare } from "lucide-react"

const navItems = [
  { name: "Genel Bakış", href: "/dashboard", icon: LayoutGrid },
  { name: "Konuşmalar", href: "/", icon: MessageSquare },
  { 
    name: "CRM", 
    icon: Users,
    submenu: [
      { name: "Müşteriler", href: "/crm/customers", icon: Users },
      { name: "Tedarikçiler", href: "/crm/suppliers", icon: Building2 },
    ]
  },
  { name: "Ürünler", href: "/dashboard/products", icon: Package },
  { name: "Teklifler", href: "/dashboard/quotes", icon: Inbox },
  { name: "Finans", href: "/crm/finance", icon: TrendingUp },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="h-16 px-6 flex items-center border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Menü</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.submenu) {
            // Submenu olduğu durumda
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <item.icon size={16} />
                  <span>{item.name}</span>
                </div>
                <div className="ml-4 space-y-1">
                  {item.submenu.map((subItem) => {
                    const isActive = pathname === subItem.href || pathname?.startsWith(`${subItem.href}/`)
                    const Icon = subItem.icon
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{subItem.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          }

          // Normal menu item
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

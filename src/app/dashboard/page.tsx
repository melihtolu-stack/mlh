import Link from "next/link"
import { Package, Inbox, Users, Building2, TrendingUp, MessageSquare } from "lucide-react"

const dashboardCards = [
  {
    title: "Konuşmalar",
    description: "Müşteri konuşmalarını takip edin",
    href: "/",
    icon: MessageSquare,
    color: "bg-blue-50 text-blue-600 border-blue-200"
  },
  {
    title: "Ürünler",
    description: "Showroom kataloğunuzu yönetin",
    href: "/dashboard/products",
    icon: Package,
    color: "bg-purple-50 text-purple-600 border-purple-200"
  },
  {
    title: "Teklifler",
    description: "Gelen teklif taleplerini inceleyin",
    href: "/dashboard/quotes",
    icon: Inbox,
    color: "bg-green-50 text-green-600 border-green-200"
  },
  {
    title: "Müşteriler",
    description: "Müşteri bilgilerini yönetin",
    href: "/crm/customers",
    icon: Users,
    color: "bg-orange-50 text-orange-600 border-orange-200"
  },
  {
    title: "Tedarikçiler",
    description: "Tedarikçi ilişkilerini takip edin",
    href: "/crm/suppliers",
    icon: Building2,
    color: "bg-cyan-50 text-cyan-600 border-cyan-200"
  },
  {
    title: "Finans",
    description: "Finansal işlemleri görüntüleyin",
    href: "/crm/finance",
    icon: TrendingUp,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200"
  }
]

export default function DashboardHomePage() {
  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Genel Bakış</h1>
          <p className="text-gray-600 mt-2">
            MLH CRM sistemine hoş geldiniz. İşlemlerinizi buradan yönetin.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-xl hover:border-primary/30 transition-all"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 border-2 ${card.color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {card.description}
                </p>
              </Link>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-2xl border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Hızlı İstatistikler</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">-</div>
              <div className="text-sm text-gray-500">Toplam Konuşma</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">-</div>
              <div className="text-sm text-gray-500">Toplam Ürün</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">-</div>
              <div className="text-sm text-gray-500">Bekleyen Teklif</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">-</div>
              <div className="text-sm text-gray-500">Aktif Müşteri</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

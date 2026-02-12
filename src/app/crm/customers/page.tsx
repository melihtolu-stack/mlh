"use client"

import { Users } from "lucide-react"

export default function CustomersPage() {
  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Müşteriler
          </h1>
          <p className="text-gray-600 mt-2">
            Müşteri bilgilerini buradan yönetin
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Müşteri Yönetimi
          </h3>
          <p className="text-gray-600 mb-6">
            Bu bölüm yakında aktif olacak
          </p>
        </div>
      </div>
    </div>
  )
}

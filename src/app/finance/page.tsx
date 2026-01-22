"use client"

import BottomNav from "@/components/BottomNav"

export default function FinancePage() {
  return (
    <div className="h-full flex flex-col bg-background pb-16">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Finans</h1>
          <p className="text-xs text-secondary mt-1">Financial Management</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-6 mx-auto">
            <span className="text-5xl">💰</span>
          </div>
          <div className="text-gray-700 font-semibold text-lg mb-2">Finans bölümü</div>
          <div className="text-sm text-secondary">Yakında eklenecek</div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

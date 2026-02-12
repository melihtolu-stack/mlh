"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { Quote, QuoteStatus } from "@/types/products"
import { Inbox, RefreshCw } from "lucide-react"

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const quotesRes = await fetch("/api/quotes", { cache: "no-store" })
      if (!quotesRes.ok) {
        throw new Error("Failed to load data")
      }
      const quotesData = await quotesRes.json()
      setQuotes(Array.isArray(quotesData) ? quotesData : [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Teklifler yüklenemedi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  const statusOptions: QuoteStatus[] = ["new", "contacted", "quoted", "production", "closed"]

  const statusStyles: Record<QuoteStatus, string> = {
    new: "bg-blue-50 text-blue-700 border border-blue-200",
    contacted: "bg-amber-50 text-amber-700 border border-amber-200",
    quoted: "bg-purple-50 text-purple-700 border border-purple-200",
    production: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    closed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  }

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    setSavingId(quoteId)
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        throw new Error("Failed to update status")
      }
      setQuotes((prev) => prev.map((quote) => (quote.id === quoteId ? { ...quote, status } : quote)))
    } catch (err) {
      console.error(err)
      alert("Durum güncellenemedi.")
    } finally {
      setSavingId(null)
    }
  }

  // Filtreleme
  const filteredQuotes = quotes.filter((quote) =>
    quote.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Inbox className="w-8 h-8 text-primary" />
                Teklif Talepleri
              </h1>
              <p className="text-gray-600 mt-2">
                Showroom'dan gelen B2B teklif taleplerini inceleyin ve yönetin
              </p>
            </div>
            <button
              onClick={() => fetchQuotes()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Şirket, kişi veya e-posta ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Quotes Table/Grid */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
              <div className="text-gray-500">Teklifler yükleniyor...</div>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hata Oluştu</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => fetchQuotes()}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-all"
              >
                Tekrar Dene
              </button>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "Teklif Bulunamadı" : "Henüz Teklif Yok"}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? "Farklı bir arama terimi deneyin" 
                  : "Showroom'dan gelen teklif talepleri burada görünecek"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Company</th>
                    <th className="text-left px-6 py-3 font-medium">Contact</th>
                    <th className="text-left px-6 py-3 font-medium">Items</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">Date</th>
                    <th className="text-right px-6 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{quote.companyName}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>{quote.contactName}</div>
                        <div className="text-xs text-gray-400">{quote.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{quote.items.length}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[quote.status]}`}
                          >
                            {quote.status}
                          </span>
                          <select
                            value={quote.status}
                            onChange={(event) =>
                              handleStatusChange(quote.id, event.target.value as QuoteStatus)
                            }
                            disabled={savingId === quote.id}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/quotes/${quote.id}`}
                          className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all inline-block"
                        >
                          Görüntüle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { Quote, QuoteStatus } from "@/types/products"

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const quotesRes = await fetch("/api/quotes", { cache: "no-store" })
        if (!quotesRes.ok) {
          throw new Error("Failed to load data")
        }
        const quotesData = await quotesRes.json()
        setQuotes(Array.isArray(quotesData) ? quotesData : [])
      } catch (err) {
        console.error(err)
        setError("Quotes could not be loaded.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
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
      setError("Status could not be updated.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Incoming Quotes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review B2B quote requests coming from the showroom.
        </p>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading quotes...</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : quotes.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No quotes yet.</div>
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
                  {quotes.map((quote) => (
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
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          View
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

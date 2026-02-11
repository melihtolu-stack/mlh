"use client"

import { useEffect, useMemo, useState } from "react"
import type { Product, Quote } from "@/types/products"

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [quotesRes, productsRes] = await Promise.all([
          fetch("/api/quotes", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
        ])
        if (!quotesRes.ok || !productsRes.ok) {
          throw new Error("Failed to load data")
        }
        const [quotesData, productsData] = await Promise.all([quotesRes.json(), productsRes.json()])
        setQuotes(Array.isArray(quotesData) ? quotesData : [])
        setProducts(Array.isArray(productsData) ? productsData : [])
      } catch (err) {
        console.error(err)
        setError("Quotes could not be loaded.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product.name]))
  }, [products])

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
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedQuote && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedQuote.companyName}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedQuote.contactName}</p>
                </div>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div>Email: {selectedQuote.email}</div>
                <div>Phone: {selectedQuote.phone || "-"}</div>
                <div>Country: {selectedQuote.country || "-"}</div>
                <div>Status: {selectedQuote.status}</div>
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Requested items</h3>
                <div className="space-y-2">
                  {selectedQuote.items.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700"
                    >
                      <span>{productMap.get(item.productId) || item.productId}</span>
                      <span className="font-semibold">Qty {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

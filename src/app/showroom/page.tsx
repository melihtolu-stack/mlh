"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { Product, QuoteItem } from "@/types/products"

interface QuoteFormState {
  companyName: string
  contactName: string
  email: string
  phone: string
  country: string
}

const emptyQuoteForm: QuoteFormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  country: "",
}

const BASKET_STORAGE_KEY = "showroom_quote_basket"

export default function ShowroomPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [basket, setBasket] = useState<QuoteItem[]>([])
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>(emptyQuoteForm)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(BASKET_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setBasket(parsed)
        }
      }
    } catch (err) {
      console.error("Failed to parse basket storage:", err)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket))
    } catch (err) {
      console.error("Failed to save basket storage:", err)
    }
  }, [basket])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load products")
        const data = await res.json()
        setProducts(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const basketCount = useMemo(
    () => basket.reduce((total, item) => total + item.quantity, 0),
    [basket]
  )

  const containerSummary = useMemo(() => {
    let totalCartons = 0
    let totalPallets = 0
    const capacity20List: number[] = []
    const capacity40List: number[] = []

    basket.forEach((item) => {
      const product = products.find((prod) => prod.id === item.productId)
      if (!product) return

      const unitsPerCarton = Number(product.unitsPerCarton) || 0
      const cartonsPerPallet = Number(product.cartonsPerPallet) || 0
      const palletsPer20ft = Number(product.palletsPer20ft) || 0
      const palletsPer40ft = Number(product.palletsPer40ft) || 0

      if (palletsPer20ft > 0) capacity20List.push(palletsPer20ft)
      if (palletsPer40ft > 0) capacity40List.push(palletsPer40ft)

      const cartons = unitsPerCarton > 0 ? item.quantity / unitsPerCarton : 0
      const pallets = cartonsPerPallet > 0 ? cartons / cartonsPerPallet : 0

      totalCartons += cartons
      totalPallets += pallets
    })

    const capacity20ft = capacity20List.length ? Math.min(...capacity20List) : 0
    const capacity40ft = capacity40List.length ? Math.min(...capacity40List) : 0

    const fill20 = capacity20ft ? Math.min(100, (totalPallets / capacity20ft) * 100) : 0
    const fill40 = capacity40ft ? Math.min(100, (totalPallets / capacity40ft) * 100) : 0

    return {
      totalCartons,
      totalPallets,
      capacity20ft,
      capacity40ft,
      fill20,
      fill40,
      remaining20: capacity20ft ? Math.max(0, 100 - fill20) : 0,
      remaining40: capacity40ft ? Math.max(0, 100 - fill40) : 0,
    }
  }, [basket, products])

  const updateBasketItem = (product: Product, quantity: number) => {
    const safeQuantity = Math.max(product.minimumOrderQuantity || 100, quantity)
    setBasket((prev) => {
      const exists = prev.find((item) => item.productId === product.id)
      if (exists) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: safeQuantity } : item
        )
      }
      return [...prev, { productId: product.id, quantity: safeQuantity }]
    })
  }

  const removeFromBasket = (productId: string) => {
    setBasket((prev) => prev.filter((item) => item.productId !== productId))
  }

  const handleSubmitQuote = async () => {
    setSubmitting(true)
    setMessage(null)
    try {
      if (!quoteForm.companyName || !quoteForm.contactName || !quoteForm.email) {
        throw new Error("Please fill in company, contact name and email.")
      }
      if (basket.length === 0) {
        throw new Error("Your basket is empty.")
      }

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quoteForm, items: basket }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Quote submission failed.")
      }
      setMessage({ type: "success", text: "Quote request sent successfully." })
      setBasket([])
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(BASKET_STORAGE_KEY)
      }
      setQuoteForm(emptyQuoteForm)
    } catch (err: any) {
      console.error(err)
      setMessage({ type: "error", text: err.message || "Something went wrong." })
    } finally {
      setSubmitting(false)
    }
  }

  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const getQuantity = (product: Product) =>
    quantities[product.id] ?? (product.minimumOrderQuantity || 100)

  const increaseQuantity = (product: Product) => {
    const step = product.minimumOrderQuantity || 100
    setQuantities((prev) => ({
      ...prev,
      [product.id]: getQuantity(product) + step,
    }))
  }

  const decreaseQuantity = (product: Product) => {
    const step = product.minimumOrderQuantity || 100
    setQuantities((prev) => ({
      ...prev,
      [product.id]: Math.max(step, getQuantity(product) - step),
    }))
  }

  const addToBasketFromCard = (product: Product) => {
    updateBasketItem(product, getQuantity(product))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">B2B Showroom</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-xl">
              Discover premium products crafted for international partners. Build your
              quote basket and submit a request in minutes.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Basket: <span className="font-semibold text-gray-900">{basketCount}</span> units
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          <div>
            {loading ? (
              <div className="text-sm text-gray-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-sm text-gray-500">No products available yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-10">
                {products.map((product) => {
                  const productSlug = typeof product.slug === "string" ? product.slug.trim() : ""

                  if (!productSlug) {
                    console.warn("Missing product slug:", product)
                  }

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      {productSlug ? (
                        <Link href={`/showroom/${productSlug}`}>
                          <div className="w-full h-72 bg-gray-100 flex items-center justify-center">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="object-contain h-full w-full p-8"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                                No image
                              </div>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="w-full h-72 bg-gray-100 flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="object-contain h-full w-full p-8"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                              No image
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-6 flex flex-col flex-grow">
                        {productSlug ? (
                          <Link href={`/showroom/${productSlug}`}>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                          </Link>
                        ) : (
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                        )}
                      <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                        {product.shortDescription || product.description}
                      </p>
                      <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full mb-4 inline-block">
                        MOQ {product.minimumOrderQuantity}
                      </span>
                      <div className="mt-auto space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            MOQ {product.minimumOrderQuantity}
                          </span>
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => decreaseQuantity(product)}
                              className="px-3 py-1 text-gray-600 hover:text-gray-900"
                            >
                              -
                            </button>
                            <span className="px-4 text-sm font-medium text-gray-900">
                              {getQuantity(product)}
                            </span>
                            <button
                              type="button"
                              onClick={() => increaseQuantity(product)}
                              className="px-3 py-1 text-gray-600 hover:text-gray-900"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addToBasketFromCard(product)}
                          className="w-full bg-black text-white py-2 rounded-xl hover:opacity-90 transition"
                        >
                          Add to Quote Basket
                        </button>
                      </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quote Basket</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Minimum order is enforced per product.
                </p>
              </div>

              <div className="space-y-3">
                {basket.length === 0 ? (
                  <div className="text-sm text-gray-500">Add products to request a quote.</div>
                ) : (
                  basket.map((item) => {
                    const product = products.find((prod) => prod.id === item.productId)
                    return (
                      <div
                        key={item.productId}
                        className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {product?.name || item.productId}
                            </div>
                            <div className="text-xs text-gray-400">
                              MOQ {product?.minimumOrderQuantity}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromBasket(item.productId)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </div>
                        <div className="mt-2">
                          <input
                            type="number"
                            min={product?.minimumOrderQuantity || 100}
                            value={item.quantity}
                            onChange={(e) =>
                              product && updateBasketItem(product, Number(e.target.value) || 0)
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Container Simulation</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Total cartons:{" "}
                    <span className="font-semibold text-gray-900">
                      {containerSummary.totalCartons.toFixed(2)}
                    </span>
                    {" · "}
                    Total pallets:{" "}
                    <span className="font-semibold text-gray-900">
                      {containerSummary.totalPallets.toFixed(2)}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>20ft Container</span>
                    <span>{Math.round(containerSummary.fill20)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${containerSummary.fill20}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>40ft Container</span>
                    <span>{Math.round(containerSummary.fill40)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600/80 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${containerSummary.fill40}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
              <input
                value={quoteForm.companyName}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, companyName: e.target.value }))}
                placeholder="Company name"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <input
                value={quoteForm.contactName}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, contactName: e.target.value }))}
                placeholder="Contact name"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <input
                type="email"
                value={quoteForm.email}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <input
                value={quoteForm.phone}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <input
                value={quoteForm.country}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="Country"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              </div>

              {message && (
                <div
                  className={`text-xs font-medium ${
                    message.type === "success" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitQuote}
                disabled={submitting}
                className="w-full px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Quote"}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

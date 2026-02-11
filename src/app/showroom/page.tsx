"use client"

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

export default function ShowroomPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalQuantity, setModalQuantity] = useState(0)
  const [basket, setBasket] = useState<QuoteItem[]>([])
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>(emptyQuoteForm)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

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

  useEffect(() => {
    if (!selectedProduct) return
    setModalQuantity(selectedProduct.minimumOrderQuantity || 100)
  }, [selectedProduct])

  const basketCount = useMemo(
    () => basket.reduce((total, item) => total + item.quantity, 0),
    [basket]
  )

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
      setQuoteForm(emptyQuoteForm)
    } catch (err: any) {
      console.error(err)
      setMessage({ type: "error", text: err.message || "Something went wrong." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
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

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div>
            {loading ? (
              <div className="text-sm text-gray-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-sm text-gray-500">No products available yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="text-left rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all p-5 group"
                  >
                    <div className="aspect-[4/3] rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.shortDescription || product.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                        <span>{product.category || "General"}</span>
                        <span>MOQ {product.minimumOrderQuantity}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 h-fit">
            <h2 className="text-lg font-semibold text-gray-900">Quote Basket</h2>
            <p className="text-xs text-gray-400 mt-1">Minimum order is enforced per product.</p>

            <div className="mt-4 space-y-3">
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
                          <div className="text-xs text-gray-400">MOQ {product?.minimumOrderQuantity}</div>
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
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-6 space-y-3">
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
                className={`mt-4 text-xs font-medium ${
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
              className="mt-5 w-full px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Quote"}
            </button>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-500">{selectedProduct.category || "General"}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-6 px-6 py-6">
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
                  {selectedProduct.images?.[0] ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                      No image
                    </div>
                  )}
                </div>
                {selectedProduct.images?.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedProduct.images.slice(1, 5).map((image, index) => (
                      <img
                        key={`${image}-${index}`}
                        src={image}
                        alt="Thumbnail"
                        className="h-16 w-full object-cover rounded-xl border border-gray-100"
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-600">{selectedProduct.description}</p>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Size</span>
                    <span className="font-semibold">{selectedProduct.size || "-"}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>MOQ</span>
                    <span className="font-semibold">{selectedProduct.minimumOrderQuantity}</span>
                  </div>
                </div>

                {selectedProduct.variants?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Variants</h3>
                    <div className="mt-2 space-y-2">
                      {selectedProduct.variants.map((variant, index) => (
                        <div
                          key={`${variant.name}-${index}`}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600"
                        >
                          {variant.name || "Variant"} · {variant.color || "Color"} · {variant.scent || "Scent"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.certificates?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Certificates</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedProduct.certificates.map((cert) => (
                        <span
                          key={cert}
                          className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min={selectedProduct.minimumOrderQuantity || 100}
                    value={modalQuantity}
                    onChange={(e) => setModalQuantity(Number(e.target.value) || 0)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateBasketItem(selectedProduct, modalQuantity)
                    setSelectedProduct(null)
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
                >
                  Add to Quote Basket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { Product, QuoteItem } from "@/types/products"

const BASKET_STORAGE_KEY = "showroom_quote_basket"

export default function ProductDetailClient({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(product.minimumOrderQuantity || 100)
  const [message, setMessage] = useState<string | null>(null)

  const minQuantity = useMemo(() => product.minimumOrderQuantity || 100, [product.minimumOrderQuantity])

  const addToBasket = () => {
    const safeQuantity = Math.max(minQuantity, quantity)
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(BASKET_STORAGE_KEY) : null
      const parsed = raw ? JSON.parse(raw) : []
      const basket: QuoteItem[] = Array.isArray(parsed) ? parsed : []
      const existing = basket.find((item) => item.productId === product.id)
      if (existing) {
        existing.quantity = safeQuantity
      } else {
        basket.push({ productId: product.id, quantity: safeQuantity })
      }
      window.localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket))
      setMessage("Added to quote basket.")
    } catch (err) {
      console.error("Failed to update basket:", err)
      setMessage("Could not update basket. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href="/showroom"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to showroom
        </Link>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                  No image
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt={`${product.name} thumbnail`}
                    className="h-16 w-full object-cover rounded-xl border border-gray-100"
                  />
                ))}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">{product.name}</h1>
              <p className="text-sm text-gray-500 mt-2">
                {product.shortDescription || product.description}
              </p>
            </div>
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Category</span>
                <span className="font-semibold text-gray-900">{product.category || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                <span>Size</span>
                <span className="font-semibold text-gray-900">{product.size || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                <span>MOQ</span>
                <span className="font-semibold text-gray-900">{minQuantity}</span>
              </div>
            </div>

            {product.variants?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Variants</h2>
                <div className="mt-3 space-y-2">
                  {product.variants.map((variant, index) => (
                    <div
                      key={`${variant.name}-${index}`}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600"
                    >
                      {variant.name || "Variant"} · {variant.color || "Color"} ·{" "}
                      {variant.scent || "Scent"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.certificates?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Certificates</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.certificates.map((cert) => (
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

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                min={minQuantity}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value) || 0)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              {message && (
                <div className="mt-3 text-xs font-medium text-gray-600">{message}</div>
              )}
              <button
                type="button"
                onClick={addToBasket}
                className="mt-4 w-full px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
              >
                Add to Quote Basket
              </button>
              <Link
                href="/showroom"
                className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-700"
              >
                View basket
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

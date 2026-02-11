"use client"

import { useMemo, useState } from "react"
import type { Product, QuoteItem } from "@/types/products"

const BASKET_STORAGE_KEY = "showroom_quote_basket"

export default function ProductDetailClient({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(product.minimumOrderQuantity || 100)
  const [message, setMessage] = useState<string | null>(null)

  const minQuantity = useMemo(
    () => product.minimumOrderQuantity || 100,
    [product.minimumOrderQuantity]
  )

  const increase = () => setQuantity((prev) => prev + minQuantity)
  const decrease = () => setQuantity((prev) => Math.max(minQuantity, prev - minQuantity))

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">MOQ {minQuantity}</span>
        <div className="flex items-center border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={decrease}
            className="px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            -
          </button>
          <span className="px-4 text-sm font-medium text-gray-900">{quantity}</span>
          <button
            type="button"
            onClick={increase}
            className="px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            +
          </button>
        </div>
      </div>
      {message && <div className="text-xs text-gray-500">{message}</div>}
      <button
        type="button"
        onClick={addToBasket}
        className="w-full bg-black text-white py-2 rounded-xl hover:opacity-90 transition"
      >
        Add to Quote Basket
      </button>
    </div>
  )
}

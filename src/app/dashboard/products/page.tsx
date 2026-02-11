"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { Product } from "@/types/products"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setError("Products could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setProducts((prev) => prev.filter((product) => product.id !== id))
    } catch (err) {
      console.error(err)
      setError("Product could not be deleted.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your catalog with clean, premium presentation.
            </p>
          </div>
          <Link
            href="/dashboard/products/new"
            className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
          >
            Create New Product
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading products...</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : products.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No products yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Product</th>
                    <th className="text-left px-6 py-3 font-medium">Category</th>
                    <th className="text-left px-6 py-3 font-medium">MOQ</th>
                    <th className="text-left px-6 py-3 font-medium">Created</th>
                    <th className="text-right px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-400">{product.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{product.category || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{product.minimumOrderQuantity}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="text-red-500 text-sm font-medium hover:underline disabled:opacity-50"
                        >
                          {deletingId === product.id ? "Deleting..." : "Delete"}
                        </button>
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

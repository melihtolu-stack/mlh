"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { Product } from "@/types/products"
import { Search, Package, Plus, Download, RefreshCw } from "lucide-react"
import Image from "next/image"
import { getProductImage } from '@/types/products';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/products", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Ürünler yüklenemedi. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setProducts((prev) => prev.filter((product) => product.id !== id))
    } catch (err) {
      console.error(err)
      alert("Ürün silinemedi. Lütfen tekrar deneyin.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleImportFromWooCommerce = async () => {
    if (!confirm("Tidy Hill WooCommerce'den ürünleri içe aktarmak istiyor musunuz? Bu işlem birkaç dakika sürebilir.")) return
    setImporting(true)
    setError(null)
    try {
      const res = await fetch("/api/products/import-from-woocommerce", { 
        method: "POST",
        cache: "no-store" 
      })
      if (!res.ok) throw new Error("Import failed")
      const data = await res.json()
      alert(`Başarıyla ${data.imported || 0} ürün içe aktarıldı!`)
      await fetchProducts() // Refresh list
    } catch (err) {
      console.error(err)
      setError("WooCommerce'den ürün içe aktarma başarısız oldu.")
    } finally {
      setImporting(false)
    }
  }

  // Filtreleme
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                Ürün Yönetimi
              </h1>
              <p className="text-gray-600 mt-2">
                Showroom kataloğunuzu buradan yönetin. Ürünler showroom'da otomatik olarak görünecektir.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchProducts()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
              <button
                onClick={handleImportFromWooCommerce}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Download className="w-4 h-4" />
                {importing ? "İçe Aktarılıyor..." : "WooCommerce'den İçe Aktar"}
              </button>
              <Link
                href="/dashboard/products/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
              >
                <Plus className="w-4 h-4" />
                Yeni Ürün Ekle
              </Link>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Products Grid or Error */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-9 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border-2 border-red-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hata Oluştu</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchProducts()}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-all"
            >
              Tekrar Dene
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "Ürün Bulunamadı" : "Henüz Ürün Yok"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? "Farklı bir arama terimi deneyin" 
                : "İlk ürününüzü ekleyerek başlayın veya WooCommerce'den içe aktarın"}
            </p>
            {!searchQuery && (
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/dashboard/products/new"
                  className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-all"
                >
                  Yeni Ürün Ekle
                </Link>
                <button
                  onClick={handleImportFromWooCommerce}
                  className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-all"
                >
                  İçe Aktar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const imageUrl = getProductImage(product);
              
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group"
                >
                  {/* Product Image */}
                  <Link href={`/dashboard/products/${product.id}`}>
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link href={`/dashboard/products/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500 mb-2">{product.category || "Kategorisiz"}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span className="text-xs">MOQ: {product.minimumOrderQuantity || "N/A"}</span>
                      <span className="text-xs text-gray-400">{product.sku || "SKU yok"}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="flex-1 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all text-center"
                      >
                        Düzenle
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {deletingId === product.id ? "..." : "Sil"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                <div className="text-sm text-gray-500">Toplam Ürün</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.category).length}
                </div>
                <div className="text-sm text-gray-500">Kategorili</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Array.from(new Set(products.map(p => p.category).filter(Boolean))).length}
                </div>
                <div className="text-sm text-gray-500">Kategori</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{filteredProducts.length}</div>
                <div className="text-sm text-gray-500">Gösterilen</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
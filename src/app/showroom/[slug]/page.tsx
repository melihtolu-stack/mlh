import Link from "next/link"
import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase"
import type { Product } from "@/types/products"
import ProductDetailClient from "@/components/showroom/ProductDetailClient"

export const dynamic = "force-dynamic"

const mapProduct = (item: any): Product => ({
  id: item.id,
  name: item.name,
  slug: item.slug,
  category: item.category || "",
  description: item.description || "",
  shortDescription: item.short_description || "",
  size: item.size || "",
  minimumOrderQuantity: item.minimum_order_quantity ?? 100,
  unitsPerCarton: item.units_per_carton ?? 0,
  cartonsPerPallet: item.cartons_per_pallet ?? 0,
  palletsPer20ft: item.pallets_per_20ft ?? 0,
  palletsPer40ft: item.pallets_per_40ft ?? 0,
  images: Array.isArray(item.images) ? item.images : [],
  variants: Array.isArray(item.variants) ? item.variants : [],
  certificates: Array.isArray(item.certificates) ? item.certificates : [],
  exportInfo: item.export_info || "",
  pdfUrl: item.pdf_url || "",
  msdsUrl: item.msds_url || "",
  videoUrl: item.video_url || "",
  referenceCountries: Array.isArray(item.reference_countries) ? item.reference_countries : [],
  seoTitle: item.seo_title || "",
  seoDescription: item.seo_description || "",
  createdAt: item.created_at,
})

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const supabase = createServerClient()
  const { data } = await supabase.from("products").select("*").eq("slug", params.slug).single()
  const product = data ? mapProduct(data) : null
  if (!product) {
    return {
      title: "Product not found",
      description: "The requested product could not be found.",
    }
  }

  const title = product.seoTitle || product.name
  const description = product.seoDescription || product.shortDescription || product.description

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
    },
  }
}

export default async function ShowroomProductPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>
}) {
  const resolvedParams = await Promise.resolve(params)
  const rawParam = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : ""
  const rawSlug = decodeURIComponent(rawParam).trim()
  console.log("URL SLUG:", rawSlug)
  const supabase = createServerClient()
  let { data, error } = await supabase.from("products").select("*").eq("slug", rawSlug).single()
  if (!data) {
    const fallback = await supabase.from("products").select("*").ilike("slug", rawSlug).single()
    data = fallback.data
    error = fallback.error
  }
  console.log("DB RESULT:", data)
  console.log("DB ERROR:", error)

  if (!data) {
    return (
      <pre className="whitespace-pre-wrap break-words bg-white p-6 text-xs text-gray-700">
        {JSON.stringify({ slug: rawSlug, data, error }, null, 2)}
      </pre>
    )
  }

  const product = mapProduct(data)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          <Link href="/showroom" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to showroom
          </Link>
          <div className="w-full h-96 bg-white rounded-2xl shadow-sm flex items-center justify-center">
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
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-3">
              {product.shortDescription || product.description}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Product Details</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description || product.shortDescription}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Category</span>
              <span className="font-semibold text-gray-900">{product.category || "-"}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Size</span>
              <span className="font-semibold text-gray-900">{product.size || "-"}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <ProductDetailClient product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}

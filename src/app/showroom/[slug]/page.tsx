import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import type { Product } from "@/types/products"
import ProductDetailClient from "@/components/showroom/ProductDetailClient"

export const revalidate = 60

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

const getProductBySlug = async (slug: string) => {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).single()
  if (error || !data) return null
  return mapProduct(data)
}

export async function generateStaticParams() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase.from("products").select("slug")
    return (data || []).filter((item) => item.slug).map((item) => ({ slug: item.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)
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
      type: "product",
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
    },
  }
}

export default async function ShowroomProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug)
  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase"
import ProductDetailClient from "@/components/showroom/ProductDetailClient"

type ShowroomParams = { slug: string }

const fetchProductBySlug = async (slug: string) => {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).single()
  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    category: data.category || "",
    description: data.description || "",
    shortDescription: data.short_description || "",
    size: data.size || "",
    minimumOrderQuantity: data.minimum_order_quantity ?? 100,
    images: Array.isArray(data.images) ? data.images : [],
    variants: Array.isArray(data.variants) ? data.variants : [],
    certificates: Array.isArray(data.certificates) ? data.certificates : [],
    exportInfo: data.export_info || "",
    pdfUrl: data.pdf_url || "",
    msdsUrl: data.msds_url || "",
    videoUrl: data.video_url || "",
    referenceCountries: Array.isArray(data.reference_countries) ? data.reference_countries : [],
    seoTitle: data.seo_title || "",
    seoDescription: data.seo_description || "",
  }
}

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase.from("products").select("slug")
    return (data || []).map((item) => ({ slug: item.slug }))
  } catch (error) {
    console.error("generateStaticParams error:", error)
    return []
  }
}

export async function generateMetadata({ params }: { params: ShowroomParams }): Promise<Metadata> {
  const product = await fetchProductBySlug(params.slug)
  if (!product) {
    return {
      title: "Product not found",
      description: "The requested product could not be found.",
    }
  }

  const title = product.seoTitle || product.name
  const description = product.seoDescription || product.shortDescription || product.description
  const images = product.images?.length ? [{ url: product.images[0], alt: product.name }] : []

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "article",
    },
  }
}

export default async function ShowroomProductPage({ params }: { params: ShowroomParams }) {
  const product = await fetchProductBySlug(params.slug)
  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link
          href="/showroom"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back to showroom
        </Link>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
          <div className="space-y-6">
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
                    alt="Thumbnail"
                    className="h-16 w-full object-cover rounded-xl border border-gray-100"
                  />
                ))}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
              {(product.shortDescription || product.description) && (
                <p className="text-sm text-gray-500 mt-2">
                  {product.shortDescription || product.description}
                </p>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Category</span>
                <span className="font-semibold text-gray-900">{product.category || "General"}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                <span>Size</span>
                <span className="font-semibold text-gray-900">{product.size || "-"}</span>
              </div>
            </div>

            {product.variants?.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-900">Variants</h2>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  {product.variants.map((variant, index) => (
                    <div
                      key={`${variant.name}-${index}`}
                      className="rounded-xl border border-gray-200 px-4 py-2"
                    >
                      {variant.name || "Variant"} · {variant.color || "Color"} ·{" "}
                      {variant.scent || "Scent"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.certificates?.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
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

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <ProductDetailClient
                productId={product.id}
                minimumOrderQuantity={product.minimumOrderQuantity}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

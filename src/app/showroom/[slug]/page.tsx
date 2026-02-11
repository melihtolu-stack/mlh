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
      type: "article",
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

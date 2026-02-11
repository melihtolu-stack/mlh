import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : []

const normalizeVariants = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") return null
          const variant = item as { name?: string; color?: string; scent?: string }
          return {
            name: typeof variant.name === "string" ? variant.name.trim() : "",
            color: typeof variant.color === "string" ? variant.color.trim() : "",
            scent: typeof variant.scent === "string" ? variant.scent.trim() : "",
          }
        })
        .filter((item) => item && (item.name || item.color || item.scent))
    : []

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    const mapped = (data || []).map((item) => ({
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
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Products GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    const slugInput = typeof body.slug === "string" ? body.slug.trim() : ""
    const slug = slugInput || toSlug(name)

    const minimumOrderQuantity = Number(body.minimumOrderQuantity) || 100
    const unitsPerCarton = Number(body.unitsPerCarton) || 0
    const cartonsPerPallet = Number(body.cartonsPerPallet) || 0
    const palletsPer20ft = Number(body.palletsPer20ft) || 0
    const palletsPer40ft = Number(body.palletsPer40ft) || 0
    const payload = {
      name,
      slug,
      category: typeof body.category === "string" ? body.category.trim() : null,
      description: typeof body.description === "string" ? body.description.trim() : null,
      short_description: typeof body.shortDescription === "string" ? body.shortDescription.trim() : null,
      size: typeof body.size === "string" ? body.size.trim() : null,
      minimum_order_quantity: minimumOrderQuantity < 1 ? 100 : minimumOrderQuantity,
      units_per_carton: unitsPerCarton < 0 ? 0 : unitsPerCarton,
      cartons_per_pallet: cartonsPerPallet < 0 ? 0 : cartonsPerPallet,
      pallets_per_20ft: palletsPer20ft < 0 ? 0 : palletsPer20ft,
      pallets_per_40ft: palletsPer40ft < 0 ? 0 : palletsPer40ft,
      images: normalizeStringArray(body.images),
      variants: normalizeVariants(body.variants),
      certificates: normalizeStringArray(body.certificates),
      export_info: typeof body.exportInfo === "string" ? body.exportInfo.trim() : null,
      pdf_url: typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : null,
      msds_url: typeof body.msdsUrl === "string" ? body.msdsUrl.trim() : null,
      video_url: typeof body.videoUrl === "string" ? body.videoUrl.trim() : null,
      reference_countries: normalizeStringArray(body.referenceCountries),
      seo_title: typeof body.seoTitle === "string" ? body.seoTitle.trim() : null,
      seo_description: typeof body.seoDescription === "string" ? body.seoDescription.trim() : null,
    }

    const supabase = createServerClient()
    const { data, error } = await supabase.from("products").insert(payload).select("*").single()

    if (error) {
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      slug: data.slug,
      category: data.category || "",
      description: data.description || "",
      shortDescription: data.short_description || "",
      size: data.size || "",
      minimumOrderQuantity: data.minimum_order_quantity ?? 100,
      unitsPerCarton: data.units_per_carton ?? 0,
      cartonsPerPallet: data.cartons_per_pallet ?? 0,
      palletsPer20ft: data.pallets_per_20ft ?? 0,
      palletsPer40ft: data.pallets_per_40ft ?? 0,
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
      createdAt: data.created_at,
    })
  } catch (error) {
    console.error("Products POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

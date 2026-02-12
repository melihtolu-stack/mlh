import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
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

/* =========================
   GET PRODUCT
========================= */

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      console.error(error)
      return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
    }

    return NextResponse.json(mapProduct(data))
  } catch (error) {
    console.error("Product GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/* =========================
   UPDATE PRODUCT
========================= */

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const body = await request.json()

    const payload = {
      name: body.name?.trim() || null,
      slug: body.slug?.trim() || null,
      category: body.category?.trim() || null,
      description: body.description?.trim() || null,
      short_description: body.shortDescription?.trim() || null,
      size: body.size?.trim() || null,

      minimum_order_quantity: Number(body.minimumOrderQuantity) || 100,
      units_per_carton: Number(body.unitsPerCarton) || 0,
      cartons_per_pallet: Number(body.cartonsPerPallet) || 0,
      pallets_per_20ft: Number(body.palletsPer20ft) || 0,
      pallets_per_40ft: Number(body.palletsPer40ft) || 0,

      images: normalizeStringArray(body.images),
      variants: normalizeVariants(body.variants),
      certificates: normalizeStringArray(body.certificates),

      export_info: body.exportInfo?.trim() || null,
      pdf_url: body.pdfUrl?.trim() || null,
      msds_url: body.msdsUrl?.trim() || null,
      video_url: body.videoUrl?.trim() || null,

      reference_countries: normalizeStringArray(body.referenceCountries),

      seo_title: body.seoTitle?.trim() || null,
      seo_description: body.seoDescription?.trim() || null,
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single()

    if (error || !data) {
      console.error(error)
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
    }

    return NextResponse.json(mapProduct(data))
  } catch (error) {
    console.error("Product PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/* =========================
   DELETE PRODUCT
========================= */

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const supabase = createServerClient()

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)

    if (error) {
      console.error(error)
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/* =========================
   RESPONSE MAPPER
========================= */

function mapProduct(data: any) {
  return {
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

    referenceCountries: Array.isArray(data.reference_countries)
      ? data.reference_countries
      : [],

    seoTitle: data.seo_title || "",
    seoDescription: data.seo_description || "",
    createdAt: data.created_at,
  }
}

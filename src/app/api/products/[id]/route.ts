import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
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
    console.error("Product GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const payload = {
      name: typeof body.name === "string" ? body.name.trim() : null,
      slug: typeof body.slug === "string" ? body.slug.trim() : null,
      category: typeof body.category === "string" ? body.category.trim() : null,
      description: typeof body.description === "string" ? body.description.trim() : null,
      short_description: typeof body.shortDescription === "string" ? body.shortDescription.trim() : null,
      size: typeof body.size === "string" ? body.size.trim() : null,
      minimum_order_quantity:
        typeof body.minimumOrderQuantity === "number" || typeof body.minimumOrderQuantity === "string"
          ? Math.max(1, Number(body.minimumOrderQuantity) || 100)
          : 100,
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
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
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
    console.error("Product PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

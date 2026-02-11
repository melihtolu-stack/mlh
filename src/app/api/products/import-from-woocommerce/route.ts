import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

const WC_API_URL = "https://tidyhill.com/wp-json/wc/v3/products"
const DEFAULTS = {
  minimumOrderQuantity: 100,
  unitsPerCarton: 12,
  cartonsPerPallet: 50,
  palletsPer20ft: 10,
  palletsPer40ft: 20,
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const normalizeVariants = (attributes: any[] | null | undefined) => {
  if (!Array.isArray(attributes)) return []
  const variants: { name: string; color: string; scent: string }[] = []

  attributes.forEach((attr) => {
    if (!attr || !Array.isArray(attr.options)) return
    const attrName = typeof attr.name === "string" ? attr.name.trim() : "Variant"
    attr.options.forEach((option: any) => {
      if (typeof option !== "string" || !option.trim()) return
      const value = option.trim()
      const lower = attrName.toLowerCase()
      variants.push({
        name: lower.includes("color") || lower.includes("scent") ? attrName : `${attrName}: ${value}`,
        color: lower.includes("color") ? value : "",
        scent: lower.includes("scent") ? value : "",
      })
    })
  })

  return variants
}

const fetchWooProducts = async () => {
  const consumerKey = process.env.WC_CONSUMER_KEY
  const consumerSecret = process.env.WC_CONSUMER_SECRET
  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing WooCommerce credentials.")
  }

  const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
  const perPage = 100
  let page = 1
  const allProducts: any[] = []

  while (true) {
    const url = `${WC_API_URL}?per_page=${perPage}&page=${page}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(`WooCommerce fetch failed: ${response.status} ${message}`)
    }

    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) break
    allProducts.push(...data)

    if (data.length < perPage) break
    page += 1
  }

  return allProducts
}

export async function POST() {
  try {
    const products = await fetchWooProducts()
    if (!products.length) {
      return NextResponse.json({ imported: 0 })
    }

    const payload = products.map((item) => ({
      name: typeof item.name === "string" ? item.name.trim() : "Untitled",
      slug: typeof item.slug === "string" && item.slug.trim()
        ? toSlug(item.slug)
        : toSlug(typeof item.name === "string" ? item.name : "product"),
      category:
        Array.isArray(item.categories) && item.categories[0]?.name
          ? String(item.categories[0].name)
          : null,
      description: typeof item.description === "string" ? item.description : null,
      short_description: typeof item.short_description === "string" ? item.short_description : null,
      images: Array.isArray(item.images) ? item.images.map((img: any) => img?.src).filter(Boolean) : [],
      variants: normalizeVariants(item.attributes),
      minimum_order_quantity: DEFAULTS.minimumOrderQuantity,
      units_per_carton: DEFAULTS.unitsPerCarton,
      cartons_per_pallet: DEFAULTS.cartonsPerPallet,
      pallets_per_20ft: DEFAULTS.palletsPer20ft,
      pallets_per_40ft: DEFAULTS.palletsPer40ft,
    }))
    .filter((item) => item.slug)

    if (!payload.length) {
      return NextResponse.json({ imported: 0 })
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from("products")
      .upsert(payload, { onConflict: "slug" })

    if (error) {
      return NextResponse.json({ error: "Failed to import products" }, { status: 500 })
    }

    return NextResponse.json({ imported: payload.length })
  } catch (error: any) {
    console.error("WooCommerce import error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

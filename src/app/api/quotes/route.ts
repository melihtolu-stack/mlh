import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

const normalizeItems = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") return null
          const entry = item as { productId?: string; quantity?: number }
          const productId = typeof entry.productId === "string" ? entry.productId : ""
          const quantity = Math.max(1, Number(entry.quantity) || 0)
          if (!productId || !quantity) return null
          return { productId, quantity }
        })
        .filter(Boolean)
    : []

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 })
    }

    const mapped = (data || []).map((item) => ({
      id: item.id,
      companyName: item.company_name,
      contactName: item.contact_name,
      email: item.email,
      phone: item.phone || "",
      country: item.country || "",
      items: Array.isArray(item.items) ? item.items : [],
      status: item.status,
      createdAt: item.created_at,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Quotes GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : ""
    const contactName = typeof body.contactName === "string" ? body.contactName.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : null
    const country = typeof body.country === "string" ? body.country.trim() : null
    const items = normalizeItems(body.items)

    if (!companyName || !contactName || !email || items.length === 0) {
      return NextResponse.json({ error: "Invalid quote payload" }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        company_name: companyName,
        contact_name: contactName,
        email,
        phone,
        country,
        items,
        status: "new",
      })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to submit quote" }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      companyName: data.company_name,
      contactName: data.contact_name,
      email: data.email,
      phone: data.phone || "",
      country: data.country || "",
      items: Array.isArray(data.items) ? data.items : [],
      status: data.status,
      createdAt: data.created_at,
    })
  } catch (error) {
    console.error("Quotes POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

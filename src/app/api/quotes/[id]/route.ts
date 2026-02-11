import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

const STATUSES = ["new", "contacted", "quoted", "production", "closed"] as const

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const { data, error } = await supabase.from("quotes").select("*").eq("id", id).single()

    if (error || !data) {
      return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 })
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
    console.error("Quote GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const status = typeof body.status === "string" ? body.status : ""

    if (!STATUSES.includes(status as typeof STATUSES[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("quotes")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update quote" }, { status: 500 })
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
    console.error("Quote PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

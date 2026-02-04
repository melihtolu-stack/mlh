import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("finance_categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""

    if (!name) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("finance_categories")
      .insert({ name })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to save category" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("finance_transactions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const amount = Number(body.amount)
    const type = body.type === "in" ? "in" : "out"
    const description = typeof body.description === "string" ? body.description.trim() : ""
    const person = typeof body.person === "string" ? body.person.trim() : ""

    if (!amount || amount <= 0 || !description || !person) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("finance_transactions")
      .insert({
        amount,
        type,
        description,
        person,
      })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to save transaction" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

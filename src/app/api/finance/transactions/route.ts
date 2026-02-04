import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("finance_transactions")
      .select("id, amount, type, description, person, created_at, category_id, finance_categories(id, name)")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    const mapped = (data || []).map((item) => {
      const category =
        Array.isArray(item.finance_categories) ? item.finance_categories[0] : item.finance_categories

      return {
        id: item.id,
        amount: Number(item.amount),
        type: item.type,
        description: item.description,
        person: item.person,
        createdAt: item.created_at,
        categoryId: item.category_id,
        categoryName: category?.name || null,
      }
    })

    return NextResponse.json(mapped)
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
    const categoryId = typeof body.category_id === "string" ? body.category_id : ""

    if (!amount || amount <= 0 || !description || !person || !categoryId) {
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
        category_id: categoryId,
      })
      .select("id, amount, type, description, person, created_at, category_id, finance_categories(id, name)")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to save transaction" }, { status: 500 })
    }

    const category = Array.isArray(data.finance_categories) ? data.finance_categories[0] : data.finance_categories

    return NextResponse.json({
      id: data.id,
      amount: Number(data.amount),
      type: data.type,
      description: data.description,
      person: data.person,
      createdAt: data.created_at,
      categoryId: data.category_id,
      categoryName: category?.name || null,
    })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import type { Quote, QuoteStatus } from "@/types/products"

const statusStyles: Record<QuoteStatus, string> = {
  new: "bg-blue-50 text-blue-700 border border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border border-amber-200",
  quoted: "bg-purple-50 text-purple-700 border border-purple-200",
  production: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  closed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
}

const mapQuote = (data: any): Quote => ({
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

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: quoteData } = await supabase.from("quotes").select("*").eq("id", params.id).single()

  if (!quoteData) {
    notFound()
  }

  const quote = mapQuote(quoteData)
  const productIds = quote.items.map((item) => item.productId).filter(Boolean)
  const { data: productsData } = await supabase
    .from("products")
    .select("id, name, slug")
    .in("id", productIds)

  const productMap = new Map(
    (productsData || []).map((product: { id: string; name: string; slug: string }) => [
      product.id,
      product,
    ])
  )

  const totalQuantity = quote.items.reduce((total, item) => total + (item.quantity || 0), 0)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link href="/dashboard/quotes" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to quotes
        </Link>

        <div className="mt-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{quote.companyName}</h1>
            <p className="text-sm text-gray-500 mt-1">{quote.contactName}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[quote.status]}`}
          >
            {quote.status}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 text-sm text-gray-600">
            <div className="text-xs text-gray-400">Email</div>
            <div className="mt-1 font-semibold text-gray-900">{quote.email}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 text-sm text-gray-600">
            <div className="text-xs text-gray-400">Phone</div>
            <div className="mt-1 font-semibold text-gray-900">{quote.phone || "-"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 text-sm text-gray-600">
            <div className="text-xs text-gray-400">Country</div>
            <div className="mt-1 font-semibold text-gray-900">{quote.country || "-"}</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Requested items</h2>
            <div className="text-sm text-gray-500">
              Total quantity: <span className="font-semibold text-gray-900">{totalQuantity}</span>
            </div>
          </div>

          <div className="space-y-3">
            {quote.items.map((item, index) => {
              const product = productMap.get(item.productId)
              return (
                <div
                  key={`${item.productId}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {product?.name || item.productId}
                    </div>
                    {product?.slug && (
                      <div className="text-xs text-gray-400">Slug: {product.slug}</div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">Qty {item.quantity}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

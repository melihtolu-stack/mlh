import Link from "next/link"

export default function DashboardHomePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Products & Quotes</h1>
        <p className="text-sm text-gray-500 mt-2">
          Manage your B2B showroom catalog and incoming quote requests.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link
            href="/dashboard/products"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <p className="text-sm text-gray-500 mt-2">
              Create and maintain your product catalog.
            </p>
          </Link>
          <Link
            href="/dashboard/quotes"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
            <p className="text-sm text-gray-500 mt-2">
              Review and track incoming quote requests.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

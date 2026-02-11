import ProductForm from "@/components/products/ProductForm"

export default function NewProductPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details to add a new product to your catalog.
        </p>
        <div className="mt-8">
          <ProductForm mode="create" />
        </div>
      </div>
    </div>
  )
}

import ProductForm from "@/components/products/ProductForm"

export default function EditProductPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-500 mt-1">Update the product details below.</p>
        <div className="mt-8">
          <ProductForm mode="edit" productId={params.id} />
        </div>
      </div>
    </div>
  )
}

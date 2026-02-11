"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { Product, ProductVariant } from "@/types/products"

type ProductFormMode = "create" | "edit"

interface ProductFormProps {
  mode: ProductFormMode
  productId?: string
}

interface ProductFormState {
  name: string
  slug: string
  category: string
  description: string
  shortDescription: string
  size: string
  minimumOrderQuantity: number
  images: string[]
  variants: ProductVariant[]
  certificates: string[]
  exportInfo: string
  pdfUrl: string
  msdsUrl: string
  videoUrl: string
  referenceCountries: string[]
  seoTitle: string
  seoDescription: string
}

const emptyForm: ProductFormState = {
  name: "",
  slug: "",
  category: "",
  description: "",
  shortDescription: "",
  size: "",
  minimumOrderQuantity: 100,
  images: [],
  variants: [],
  certificates: [],
  exportInfo: "",
  pdfUrl: "",
  msdsUrl: "",
  videoUrl: "",
  referenceCountries: [],
  seoTitle: "",
  seoDescription: "",
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

export default function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (mode !== "edit" || !productId) return

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: "no-store" })
        if (!res.ok) {
          throw new Error("Failed to load product")
        }
        const data: Product = await res.json()
        setForm({
          name: data.name || "",
          slug: data.slug || "",
          category: data.category || "",
          description: data.description || "",
          shortDescription: data.shortDescription || "",
          size: data.size || "",
          minimumOrderQuantity: data.minimumOrderQuantity || 100,
          images: data.images || [],
          variants: data.variants || [],
          certificates: data.certificates || [],
          exportInfo: data.exportInfo || "",
          pdfUrl: data.pdfUrl || "",
          msdsUrl: data.msdsUrl || "",
          videoUrl: data.videoUrl || "",
          referenceCountries: data.referenceCountries || [],
          seoTitle: data.seoTitle || "",
          seoDescription: data.seoDescription || "",
        })
      } catch (err) {
        console.error(err)
        setError("Product could not be loaded.")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [mode, productId])

  const updateField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const slugPlaceholder = useMemo(() => (form.name ? toSlug(form.name) : ""), [form.name])

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim()
    if (!url) return
    updateField("images", [...form.images, url])
    setImageUrlInput("")
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append("files", file))
      const res = await fetch("/api/products/upload", { method: "POST", body: formData })
      if (!res.ok) {
        throw new Error("Upload failed")
      }
      const data = await res.json()
      const urls = Array.isArray(data.files) ? data.files.map((file: { url: string }) => file.url) : []
      updateField("images", [...form.images, ...urls])
    } catch (err) {
      console.error(err)
      setError("Image upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        ...form,
        slug: form.slug || slugPlaceholder,
      }
      const res = await fetch(mode === "create" ? "/api/products" : `/api/products/${productId}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save product")
      }

      setSuccess("Product saved successfully.")
      router.push("/dashboard/products")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading product...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Product name</label>
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="Enter product name"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder={slugPlaceholder || "auto-generated"}
          />
          <p className="text-xs text-gray-400 mt-2">
            Leave empty to auto-generate from the product name.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <input
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Category"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Size</label>
            <input
              value={form.size}
              onChange={(e) => updateField("size", e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="e.g. 100ml, 500g"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Short description</label>
          <textarea
            value={form.shortDescription}
            onChange={(e) => updateField("shortDescription", e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            rows={3}
            placeholder="Short summary for cards"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            rows={5}
            placeholder="Full description"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Minimum order quantity</label>
          <input
            type="number"
            min={1}
            value={form.minimumOrderQuantity}
            onChange={(e) => updateField("minimumOrderQuantity", Number(e.target.value) || 100)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Images</label>
          <div className="mt-3 flex flex-wrap gap-3">
            {form.images.map((image, index) => (
              <div key={`${image}-${index}`} className="relative group">
                <img
                  src={image}
                  alt="Product"
                  className="h-24 w-24 rounded-xl object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "images",
                      form.images.filter((_, imageIndex) => imageIndex !== index)
                    )
                  }
                  className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-500 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <input
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Paste image URL and add"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Add URL
            </button>
          </div>
          <div className="mt-4">
            <label className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e.target.files)}
              />
              <span>{uploading ? "Uploading..." : "Upload images"}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Variants</label>
          <div className="mt-3 space-y-3">
            {form.variants.map((variant, index) => (
              <div key={`variant-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={variant.name}
                  onChange={(e) => {
                    const updated = [...form.variants]
                    updated[index] = { ...variant, name: e.target.value }
                    updateField("variants", updated)
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Variant name"
                />
                <input
                  value={variant.color}
                  onChange={(e) => {
                    const updated = [...form.variants]
                    updated[index] = { ...variant, color: e.target.value }
                    updateField("variants", updated)
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Color"
                />
                <div className="flex gap-2">
                  <input
                    value={variant.scent}
                    onChange={(e) => {
                      const updated = [...form.variants]
                      updated[index] = { ...variant, scent: e.target.value }
                      updateField("variants", updated)
                    }}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Scent"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "variants",
                        form.variants.filter((_, variantIndex) => variantIndex !== index)
                      )
                    }
                    className="px-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateField("variants", [...form.variants, { name: "", color: "", scent: "" }])
              }
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Add Variant
            </button>
          </div>
        </div>

        <TagInput
          label="Certificates"
          values={form.certificates}
          onChange={(values) => updateField("certificates", values)}
          placeholder="Add certificate and press enter"
        />

        <div>
          <label className="text-sm font-medium text-gray-700">Export info</label>
          <textarea
            value={form.exportInfo}
            onChange={(e) => updateField("exportInfo", e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            rows={3}
            placeholder="Export details"
          />
        </div>

        <TagInput
          label="Reference countries"
          values={form.referenceCountries}
          onChange={(values) => updateField("referenceCountries", values)}
          placeholder="Add country and press enter"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">PDF URL</label>
            <input
              value={form.pdfUrl}
              onChange={(e) => updateField("pdfUrl", e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">MSDS URL</label>
            <input
              value={form.msdsUrl}
              onChange={(e) => updateField("msdsUrl", e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Video URL</label>
            <input
              value={form.videoUrl}
              onChange={(e) => updateField("videoUrl", e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700">SEO Title</label>
          <input
            value={form.seoTitle}
            onChange={(e) => updateField("seoTitle", e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="SEO title"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">SEO Description</label>
          <textarea
            value={form.seoDescription}
            onChange={(e) => updateField("seoDescription", e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            rows={3}
            placeholder="SEO description"
          />
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : mode === "create" ? "Create Product" : "Update Product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/products")}
          className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState("")

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    const value = input.trim()
    if (!value) return
    if (!values.includes(value)) {
      onChange([...values, value])
    }
    setInput("")
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(values.filter((value) => value !== item))}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
      />
    </div>
  )
}

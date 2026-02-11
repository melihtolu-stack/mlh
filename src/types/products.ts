export interface ProductVariant {
  name: string
  color: string
  scent: string
}

export interface Product {
  id: string
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
  createdAt: string
}

export interface QuoteItem {
  productId: string
  quantity: number
}

export type QuoteStatus = "new" | "contacted" | "quoted" | "closed"

export interface Quote {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  country: string
  items: QuoteItem[]
  status: QuoteStatus
  createdAt: string
}

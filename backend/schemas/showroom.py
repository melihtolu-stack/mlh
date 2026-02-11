"""
Showroom ve cart için Pydantic schema'ları
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# Product Schemas
class ProductMedia(BaseModel):
    """Ürün medya modeli"""
    id: UUID
    media_url: str
    media_type: str  # 'image' veya 'video'
    media_category: Optional[str] = 'product'  # 'product', 'loading', 'certificate', 'technical', 'lifestyle'
    display_order: int = 0


class ProductDocument(BaseModel):
    """Ürün belge modeli"""
    id: UUID
    document_type: str  # 'msds', 'coa', 'analysis_report', 'certificate', 'spec_sheet', 'other'
    title: str
    file_url: str
    file_name: str
    file_size: Optional[int] = None
    language: str = 'en'


class ExportCountry(BaseModel):
    """İhracat ülkesi modeli"""
    id: UUID
    country_code: str
    country_name: str
    flag_url: Optional[str] = None
    compliance_notes: Optional[str] = None
    hs_code: Optional[str] = None
    display_order: int = 0


class ProductBase(BaseModel):
    """Temel ürün bilgileri"""
    id: UUID
    name: str
    slug: str
    sku: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    is_active: bool = True


class ProductListItem(ProductBase):
    """Ürün listesi için kısaltılmış model"""
    image_url: Optional[str] = None
    moq: Optional[int] = None


class ProductDetail(ProductBase):
    """Detaylı ürün modeli"""
    technical_specs: Optional[dict] = None
    features: Optional[List[str]] = None
    moq: Optional[int] = None
    media: List[ProductMedia] = []
    documents: List[ProductDocument] = []
    export_countries: List[ExportCountry] = []
    created_at: datetime
    updated_at: datetime


# Cart Schemas
class CartItemBase(BaseModel):
    """Sepet item temel model"""
    product_id: UUID
    quantity: int = Field(gt=0, description="Miktar 0'dan büyük olmalı")
    variant_id: Optional[UUID] = None


class CartItemCreate(CartItemBase):
    """Sepete ürün ekleme"""
    pass


class CartItem(CartItemBase):
    """Sepet item response"""
    id: UUID
    cart_id: UUID
    product_name: str
    product_sku: Optional[str] = None
    product_image_url: Optional[str] = None
    variant_name: Optional[str] = None
    unit_price: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class CartBase(BaseModel):
    """Sepet temel model"""
    session_id: str


class CartCreate(CartBase):
    """Sepet oluşturma"""
    pass


class Cart(CartBase):
    """Sepet response"""
    id: UUID
    items: List[CartItem] = []
    created_at: datetime
    updated_at: datetime
    
    @property
    def total_items(self) -> int:
        """Toplam ürün sayısı"""
        return len(self.items)
    
    @property
    def total_quantity(self) -> int:
        """Toplam miktar"""
        return sum(item.quantity for item in self.items)


# Quote Request Schemas
class QuoteRequestCreate(BaseModel):
    """Teklif talebi oluşturma"""
    cart_id: Optional[UUID] = None
    items: List[CartItemBase]  # Alternatif olarak direkt item listesi
    company_name: str = Field(..., min_length=2, max_length=200)
    contact_person: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=20)
    country: str = Field(..., min_length=2, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)


class QuoteRequestResponse(BaseModel):
    """Teklif talebi response"""
    id: UUID
    quote_number: str
    status: str
    created_at: datetime
    message: str = "Teklif talebiniz başarıyla alındı"


# Update schemas
class CartItemUpdate(BaseModel):
    """Sepet item güncelleme"""
    quantity: int = Field(gt=0, description="Miktar 0'dan büyük olmalı")

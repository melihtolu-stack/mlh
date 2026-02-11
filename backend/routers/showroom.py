"""
Showroom API router - Ürünler, sepet ve teklif talepleri
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from uuid import UUID

from schemas.showroom import (
    ProductListItem,
    ProductDetail,
    Cart,
    CartItemCreate,
    CartItemUpdate,
    QuoteRequestCreate,
    QuoteRequestResponse
)
from services.showroom_service import (
    get_products,
    get_product_by_slug,
    get_or_create_cart,
    add_to_cart,
    update_cart_item,
    remove_from_cart,
    create_quote_request
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/showroom", tags=["Showroom"])


@router.get("/products")
def list_products(
    category: Optional[str] = Query(None, description="Kategoriye göre filtrele"),
    search: Optional[str] = Query(None, description="Ürün adında ara"),
    limit: int = Query(50, ge=1, le=100, description="Sayfa başına ürün sayısı"),
    offset: int = Query(0, ge=0, description="Sayfalama offset")
):
    """
    Ürünleri listele (filtreleme ve sayfalama ile)
    """
    try:
        return get_products(category, search, limit, offset)
    except Exception as e:
        logger.error(f"Ürünler listelenirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products/{slug}")
def get_product_detail(slug: str):
    """
    Slug ile ürün detayını getir (medya, belgeler, ihracat ülkeleri dahil)
    """
    try:
        return get_product_by_slug(slug)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ürün detayı alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cart/{session_id}")
def get_cart(session_id: str):
    """
    Session ID'ye göre sepeti getir veya oluştur
    """
    try:
        return get_or_create_cart(session_id)
    except Exception as e:
        logger.error(f"Sepet alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cart/{session_id}/items")
def add_cart_item(session_id: str, item: CartItemCreate):
    """
    Sepete ürün ekle veya miktarı güncelle
    """
    try:
        # Önce cart'ı al/oluştur
        cart = get_or_create_cart(session_id)
        
        # Ürünü sepete ekle
        result = add_to_cart(
            cart_id=UUID(cart["id"]),
            product_id=item.product_id,
            quantity=item.quantity,
            variant_id=item.variant_id
        )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sepete ürün eklenirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/cart/items/{item_id}")
def update_item(item_id: UUID, update_data: CartItemUpdate):
    """
    Sepetteki ürün miktarını güncelle
    """
    try:
        return update_cart_item(item_id, update_data.quantity)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sepet ürünü güncellenirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cart/items/{item_id}")
def remove_item(item_id: UUID):
    """
    Sepetten ürün kaldır
    """
    try:
        return remove_from_cart(item_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sepetten ürün kaldırılırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quotes", response_model=QuoteRequestResponse)
def create_quote(quote_data: QuoteRequestCreate):
    """
    Teklif talebi oluştur
    """
    try:
        # Quote data'yı dictionary'ye çevir
        quote_dict = quote_data.model_dump()
        
        # Items'ı dictionary listesine çevir
        quote_dict["items"] = [item.model_dump() for item in quote_data.items]
        
        result = create_quote_request(quote_dict)
        return QuoteRequestResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Teklif talebi oluşturulurken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

"""
Showroom servisleri - ürün listeleme, detay, sepet ve teklif işlemleri
"""
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import HTTPException
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)


def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Ürünleri listele (filtreleme ve sayfalama ile)
    """
    try:
        supabase = get_supabase()
        
        # Base query
        query = supabase.table("products").select(
            "id, name, slug, sku, short_description, category, brand, is_active, moq"
        ).eq("is_active", True)
        
        # Filtreleme
        if category:
            query = query.eq("category", category)
        
        if search:
            query = query.ilike("name", f"%{search}%")
        
        # Sayfalama
        query = query.range(offset, offset + limit - 1).order("name")
        
        result = query.execute()
        
        # Her ürün için ilk görseli al
        products = []
        for product in result.data:
            # İlk ürün görselini al
            media_result = supabase.table("product_media").select("media_url").eq(
                "product_id", product["id"]
            ).eq("media_type", "image").eq("media_category", "product").order(
                "display_order"
            ).limit(1).execute()
            
            product["image_url"] = media_result.data[0]["media_url"] if media_result.data else None
            products.append(product)
        
        return {
            "products": products,
            "total": len(result.data),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Ürünler listelenirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ürünler listelenemedi: {str(e)}")


def get_product_by_slug(slug: str) -> Dict[str, Any]:
    """
    Slug ile ürün detayını getir (medya, belgeler, ihracat ülkeleri ile birlikte)
    """
    try:
        supabase = get_supabase()
        
        # Ürün bilgilerini al
        result = supabase.table("products").select("*").eq("slug", slug).eq("is_active", True).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        
        product = result.data[0]
        
        # Medya dosyalarını al (kategorilere göre grupla)
        media_result = supabase.table("product_media").select(
            "id, media_url, media_type, media_category, display_order"
        ).eq("product_id", product["id"]).order("display_order").execute()
        
        product["media"] = media_result.data
        
        # Belgeleri al
        docs_result = supabase.table("product_documents").select(
            "id, document_type, title, file_url, file_name, file_size, language"
        ).eq("product_id", product["id"]).eq("is_public", True).execute()
        
        product["documents"] = docs_result.data
        
        # İhracat ülkelerini al
        countries_result = supabase.table("product_export_countries").select(
            "id, country_code, country_name, flag_url, compliance_notes, hs_code, display_order"
        ).eq("product_id", product["id"]).order("display_order").execute()
        
        product["export_countries"] = countries_result.data
        
        return product
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ürün detayı alınırken hata ({slug}): {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ürün detayı alınamadı: {str(e)}")


def get_or_create_cart(session_id: str) -> Dict[str, Any]:
    """
    Session ID'ye göre sepet getir veya yeni sepet oluştur
    """
    try:
        supabase = get_supabase()
        
        # Mevcut sepeti kontrol et
        result = supabase.table("carts").select("*").eq("session_id", session_id).execute()
        
        if result.data:
            cart = result.data[0]
        else:
            # Yeni sepet oluştur
            cart_data = {
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            result = supabase.table("carts").insert(cart_data).execute()
            cart = result.data[0]
        
        # Sepetteki ürünleri al
        items = get_cart_items(cart["id"])
        cart["items"] = items
        
        return cart
        
    except Exception as e:
        logger.error(f"Sepet alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sepet alınamadı: {str(e)}")


def get_cart_items(cart_id: UUID) -> List[Dict[str, Any]]:
    """
    Sepetteki ürünleri detaylı şekilde getir
    """
    try:
        supabase = get_supabase()
        
        # Cart items'ları al
        result = supabase.table("cart_items").select(
            "id, cart_id, product_id, variant_id, quantity, created_at, updated_at"
        ).eq("cart_id", str(cart_id)).execute()
        
        items = []
        for item in result.data:
            # Ürün bilgilerini al
            product = supabase.table("products").select(
                "name, sku"
            ).eq("id", item["product_id"]).execute()
            
            if product.data:
                item["product_name"] = product.data[0]["name"]
                item["product_sku"] = product.data[0].get("sku")
                
                # İlk görseli al
                media = supabase.table("product_media").select("media_url").eq(
                    "product_id", item["product_id"]
                ).eq("media_type", "image").limit(1).execute()
                
                item["product_image_url"] = media.data[0]["media_url"] if media.data else None
            
            items.append(item)
        
        return items
        
    except Exception as e:
        logger.error(f"Sepet ürünleri alınırken hata: {str(e)}")
        return []


def add_to_cart(cart_id: UUID, product_id: UUID, quantity: int, variant_id: Optional[UUID] = None) -> Dict[str, Any]:
    """
    Sepete ürün ekle veya miktarı güncelle
    """
    try:
        supabase = get_supabase()
        
        # Ürünün var olduğunu kontrol et
        product = supabase.table("products").select("id, name").eq("id", str(product_id)).execute()
        if not product.data:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        
        # Sepette aynı ürün var mı kontrol et
        existing = supabase.table("cart_items").select("*").eq("cart_id", str(cart_id)).eq(
            "product_id", str(product_id)
        )
        
        if variant_id:
            existing = existing.eq("variant_id", str(variant_id))
        else:
            existing = existing.is_("variant_id", "null")
        
        existing_result = existing.execute()
        
        if existing_result.data:
            # Mevcut ürünü güncelle
            item_id = existing_result.data[0]["id"]
            new_quantity = existing_result.data[0]["quantity"] + quantity
            
            result = supabase.table("cart_items").update({
                "quantity": new_quantity,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", item_id).execute()
            
            return result.data[0]
        else:
            # Yeni item ekle
            item_data = {
                "cart_id": str(cart_id),
                "product_id": str(product_id),
                "variant_id": str(variant_id) if variant_id else None,
                "quantity": quantity,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = supabase.table("cart_items").insert(item_data).execute()
            return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sepete ürün eklenirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ürün sepete eklenemedi: {str(e)}")


def update_cart_item(item_id: UUID, quantity: int) -> Dict[str, Any]:
    """
    Sepetteki ürün miktarını güncelle
    """
    try:
        supabase = get_supabase()
        
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Miktar 0'dan büyük olmalı")
        
        result = supabase.table("cart_items").update({
            "quantity": quantity,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", str(item_id)).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Sepet ürünü bulunamadı")
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sepet ürünü güncellenirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ürün güncellenemedi: {str(e)}")


def remove_from_cart(item_id: UUID) -> Dict[str, str]:
    """
    Sepetten ürün kaldır
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("cart_items").delete().eq("id", str(item_id)).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Sepet ürünü bulunamadı")
        
        return {"message": "Ürün sepetten kaldırıldı"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sepetten ürün kaldırılırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ürün kaldırılamadı: {str(e)}")


def create_quote_request(quote_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Teklif talebi oluştur
    """
    try:
        supabase = get_supabase()
        
        # Quote number oluştur (ör: QT-20260212-0001)
        today = datetime.utcnow().strftime("%Y%m%d")
        quote_number = f"QT-{today}-{str(datetime.utcnow().timestamp())[-4:]}"
        
        # Quote'u oluştur
        quote = {
            "quote_number": quote_number,
            "company_name": quote_data["company_name"],
            "contact_person": quote_data["contact_person"],
            "email": quote_data["email"],
            "phone": quote_data["phone"],
            "country": quote_data["country"],
            "notes": quote_data.get("notes"),
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("quotes").insert(quote).execute()
        quote_id = result.data[0]["id"]
        
        # Quote items'ları ekle
        for item in quote_data["items"]:
            quote_item = {
                "quote_id": quote_id,
                "product_id": str(item["product_id"]),
                "variant_id": str(item.get("variant_id")) if item.get("variant_id") else None,
                "quantity": item["quantity"]
            }
            supabase.table("quote_items").insert(quote_item).execute()
        
        # Eğer cart_id varsa, sepeti temizle
        if quote_data.get("cart_id"):
            supabase.table("cart_items").delete().eq("cart_id", str(quote_data["cart_id"])).execute()
        
        return {
            "id": quote_id,
            "quote_number": quote_number,
            "status": "pending",
            "created_at": result.data[0]["created_at"],
            "message": "Teklif talebiniz başarıyla alındı"
        }
        
    except Exception as e:
        logger.error(f"Teklif talebi oluşturulurken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Teklif talebi oluşturulamadı: {str(e)}")

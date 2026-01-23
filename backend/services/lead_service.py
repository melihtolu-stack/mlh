"""
Lead service: Supabase insert, validation, optional email notification.
Lead kaydı sonrası customer + conversation + message oluşturur → CRM ekranında görünür.
"""
import logging
from typing import Optional

from fastapi import HTTPException
from services.supabase_client import supabase
from schemas.lead import LeadCreate

logger = logging.getLogger(__name__)

NOTIFY_EMAIL = "info@heni.com.tr"
WEB_CHANNEL = "web"


def _find_or_create_customer(name: str, email: str, phone: Optional[str]) -> dict:
    """Email ile müşteri bul; yoksa oluştur."""
    email = (email or "").strip().lower()
    phone = (phone or "").strip() or None
    r = supabase.table("customers").select("*").eq("email", email).execute()
    if r.data and len(r.data) > 0:
        return r.data[0]
    ins = supabase.table("customers").insert({
        "name": name,
        "email": email,
        "phone": phone or email,
    }).execute()
    if not ins.data or len(ins.data) == 0:
        raise HTTPException(status_code=500, detail="Müşteri oluşturulamadı.")
    return ins.data[0]


def _find_or_create_conversation(customer_id: str) -> dict:
    """Bu müşteri için web kanallı konuşma bul; yoksa oluştur."""
    r = (
        supabase.table("conversations")
        .select("*")
        .eq("customer_id", customer_id)
        .eq("channel", WEB_CHANNEL)
        .execute()
    )
    if r.data and len(r.data) > 0:
        return r.data[0]
    ins = (
        supabase.table("conversations")
        .insert({
            "customer_id": customer_id,
            "channel": WEB_CHANNEL,
            "last_message": None,
            "is_read": False,
            "last_message_at": None,
        })
        .execute()
    )
    if not ins.data or len(ins.data) == 0:
        raise HTTPException(status_code=500, detail="Konuşma oluşturulamadı.")
    return ins.data[0]


def create_lead(data: LeadCreate) -> dict:
    """
    leads tablosuna yeni lead ekler.
    Sonrasında customer + conversation + message oluşturur → CRM ekranında görünür.
    name, email, message zorunlu; phone opsiyonel.
    Başarılı kayıt sonrası (varsa) SMTP ile info@heni.com.tr'ye bildirim gönderir.
    """
    try:
        insert_data = {
            "name": data.name,
            "email": data.email,
            "phone": (data.phone or "").strip() or None,
            "source": "api",
            "payload": {"message": data.message},
        }

        response = (
            supabase
            .table("leads")
            .insert(insert_data)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            logger.error("Supabase insert returned no data: %s", response)
            raise HTTPException(
                status_code=500,
                detail="Lead kaydedilemedi. Lütfen tekrar deneyin.",
            )

        row = response.data[0]
        lead_id = row.get("id")
        created_at = row.get("created_at")

        # CRM'de görünsün: customer → conversation → message
        try:
            from services.message_service import get_message_service

            customer = _find_or_create_customer(
                data.name, data.email, data.phone
            )
            conv = _find_or_create_conversation(customer["id"])
            msg_svc = get_message_service()
            msg = msg_svc.create_customer_message(
                conversation_id=conv["id"],
                content=data.message,
                original_content=data.message,
                original_language="tr",
                customer_email=data.email,
            )
            if msg:
                supabase.table("conversations").update({
                    "last_message": (data.message or "")[:200],
                    "last_message_at": msg.get("sent_at"),
                    "is_read": False,
                    "updated_at": msg.get("sent_at"),
                }).eq("id", conv["id"]).execute()
                logger.info("Lead CRM’e eklendi: conversation_id=%s", conv["id"])
        except Exception as e:
            logger.warning("Lead CRM’e eklenirken hata (lead yine kaydedildi): %s", e)

        # Opsiyonel: email servisi varsa info@heni.com.tr'ye bildirim
        try:
            from services.email_service import get_email_service

            svc = get_email_service()
            if svc.is_configured():
                subject = f"[MLH] Yeni lead: {data.name}"
                body = (
                    f"Yeni lead formu gönderildi.\n\n"
                    f"Ad: {data.name}\n"
                    f"E-posta: {data.email}\n"
                    f"Telefon: {data.phone or '-'}\n\n"
                    f"Mesaj:\n{data.message}"
                )
                if svc.send_email(NOTIFY_EMAIL, subject, body, is_html=False):
                    logger.info("Lead bildirimi info@heni.com.tr'ye gönderildi.")
                else:
                    logger.warning("Lead bildirimi gönderilemedi (SMTP hatası).")
        except Exception as e:
            logger.warning("Lead email bildirimi atlandı: %s", e)

        return {
            "success": True,
            "message": "Form başarıyla gönderildi.",
            "id": str(lead_id),
            "created_at": created_at,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Lead create error: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Lead kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
        )


def list_leads():
    """Tüm lead'leri listeler."""
    try:
        response = (
            supabase
            .table("leads")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.exception("Leads list error: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Lead listesi alınamadı.",
        )

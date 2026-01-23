"""
Lead service: Supabase insert, validation, optional email notification.
"""
import logging
from fastapi import HTTPException
from services.supabase_client import supabase
from schemas.lead import LeadCreate

logger = logging.getLogger(__name__)

NOTIFY_EMAIL = "info@heni.com.tr"


def create_lead(data: LeadCreate) -> dict:
    """
    leads tablosuna yeni lead ekler.
    name, email, message zorunlu; phone opsiyonel.
    message payload içinde saklanır.
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

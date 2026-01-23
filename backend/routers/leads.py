"""
Lead form API: POST /api/leads/ (name, email, message zorunlu; phone opsiyonel).
"""
import logging
from fastapi import APIRouter, HTTPException
from schemas.lead import LeadCreate, LeadCreateResponse
from services.lead_service import create_lead, list_leads

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leads", tags=["Leads"])


@router.post("/", response_model=LeadCreateResponse, status_code=201)
def create(data: LeadCreate):
    """Lead/contact form gönderimi. name, email, message zorunlu; phone opsiyonel."""
    try:
        result = create_lead(data)
        return LeadCreateResponse(**result)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
def list_all():
    """Tüm lead'leri listeler."""
    return list_leads()

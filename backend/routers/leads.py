from fastapi import APIRouter
from schemas.lead import LeadCreate
from services.lead_service import create_lead, list_leads

router = APIRouter(prefix="/api/leads", tags=["Leads"])

@router.post("/")
def create(data: LeadCreate):
    return create_lead(data)

@router.get("/")
def list_all():
    return list_leads()

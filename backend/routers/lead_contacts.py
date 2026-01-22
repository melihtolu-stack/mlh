from fastapi import APIRouter
from schemas.lead_contact import LeadContactCreate
from services.lead_contact_service import (
    create_lead_contact,
    list_contacts_by_lead
)

router = APIRouter(prefix="/api/lead-contacts", tags=["Lead Contacts"])


@router.post("")
def create_contact(data: LeadContactCreate):
    return create_lead_contact(data)


@router.get("/by-lead/{lead_id}")
def get_contacts(lead_id: str):
    return list_contacts_by_lead(lead_id)

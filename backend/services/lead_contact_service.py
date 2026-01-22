from fastapi import HTTPException
from schemas.lead_contact import LeadContactCreate
from services.supabase_client import supabase


def create_lead_contact(data: LeadContactCreate):
    """
    lead_contacts tablosuna yeni contact ekler
    """
    try:
        payload = data.model_dump(exclude_none=True)

        response = (
            supabase
            .table("lead_contacts")
            .insert(payload)
            .execute()
        )

        if not response.data:
            raise Exception(f"Insert failed: {response}")

        return response.data[0]

    except Exception as e:
        print("SUPABASE INSERT ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="Lead contact could not be created"
        )


def list_contacts_by_lead(lead_id: str):
    """
    Belirli lead_id’ye ait tüm contactları döner
    """
    try:
        response = (
            supabase
            .table("lead_contacts")
            .select("*")
            .eq("lead_id", lead_id)
            .order("created_at", desc=True)
            .execute()
        )

        return response.data or []

    except Exception as e:
        print("SUPABASE SELECT ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="Contacts could not be fetched"
        )

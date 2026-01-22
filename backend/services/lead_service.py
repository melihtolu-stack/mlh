from fastapi import HTTPException
from services.supabase_client import supabase
from schemas.lead import LeadCreate

def create_lead(data: LeadCreate):
    """
    leads tablosuna yeni lead ekler
    """
    try:
        response = (
            supabase
            .table("leads")
            .insert(data.model_dump())
            .execute()
        )
        
        if not response.data:
            raise Exception(f"Insert failed: {response}")
        
        return response.data[0]
    
    except Exception as e:
        print("SUPABASE INSERT ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="Lead could not be created"
        )


def list_leads():
    """
    Tüm lead'leri listeler
    """
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
        print("SUPABASE SELECT ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="Leads could not be fetched"
        )

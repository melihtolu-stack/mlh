from fastapi import APIRouter, HTTPException
from services.supabase_client import supabase

router = APIRouter(prefix="/api/test", tags=["test"])

@router.get("/supabase")
def test_supabase():
    """
    Supabase bağlantısını test eder
    """
    try:
        res = supabase.table("customers").select("id").limit(1).execute()
        return {
            "success": True,
            "data": res.data
        }
    except Exception as e:
        print("SUPABASE TEST ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail=f"Supabase connection test failed: {str(e)}"
        )

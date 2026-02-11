import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase env variables missing")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# get_supabase fonksiyonu ekle (showroom_service için)
def get_supabase() -> Client:
    """Supabase client'ını döndür"""
    return supabase

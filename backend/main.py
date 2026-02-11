from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import lead_contacts, leads, health, test_supabase, emails, messages, whatsapp, qr_admin, showroom

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)


app = FastAPI(
    title="MLH Backend API",
    description="Backend API for MLH project",
    version="1.0.0"
)

# CORS ayarları
# Not: allow_credentials=True iken "*" kullanılamaz; sadece belirli origin'ler.
# Test için geçici olarak ["*"] kullanmak istersen allow_credentials=False yapın.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mlh.heni.com.tr",           # Frontend production
        "https://backend-mlh.heni.com.tr",   # Backend production
        "http://localhost:3000",             # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(lead_contacts.router)
app.include_router(leads.router)
app.include_router(test_supabase.router)
app.include_router(emails.router)
app.include_router(messages.router)
app.include_router(whatsapp.router)
app.include_router(qr_admin.router)
app.include_router(showroom.router)
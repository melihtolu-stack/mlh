import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
import ssl

print("1) Script başladı")

load_dotenv()
print("2) .env yüklendi")

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM")

print(f"3) SMTP_HOST: {SMTP_HOST}")
print(f"4) SMTP_PORT: {SMTP_PORT}")
print(f"5) SMTP_USER: {SMTP_USER}")

msg = MIMEText("Bu bir SMTP test mailidir.\n\nHostinger SMTP testi başarılı.")
msg["Subject"] = "SMTP Test"
msg["From"] = SMTP_FROM
msg["To"] = SMTP_USER

print("6) SMTP SSL bağlantısı kuruluyor...")

context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE


server = smtplib.SMTP_SSL(
    SMTP_HOST,
    SMTP_PORT,
    context=context,
    timeout=10
)

print("7) SSL bağlantı kuruldu")

server.login(SMTP_USER, SMTP_PASSWORD)
print("8) Login başarılı")

server.send_message(msg)
print("9) Mail gönderildi")

server.quit()
print("10) SMTP bağlantısı kapatıldı")

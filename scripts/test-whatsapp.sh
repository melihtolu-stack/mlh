#!/bin/bash

# WhatsApp Service Test Script
# Usage: ./scripts/test-whatsapp.sh [production|local]

ENV=${1:-local}

if [ "$ENV" = "production" ]; then
  WHATSAPP_URL="https://whatsapp-mlh.heni.com.tr"
  BACKEND_URL="https://backend-mlh.heni.com.tr"
else
  WHATSAPP_URL="http://localhost:3001"
  BACKEND_URL="http://localhost:8000"
fi

echo "🧪 WhatsApp Service Test Script"
echo "Environment: $ENV"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local name=$1
  local url=$2
  local expected_status=${3:-200}
  
  echo -n "Testing $name... "
  response=$(curl -s -w "\n%{http_code}" "$url")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ OK${NC} ($http_code)"
    echo "$body" | jq . 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
    echo "$body"
  fi
  echo ""
}

# 1. WhatsApp Service Health
echo "1️⃣ WhatsApp Service Health Check"
echo "─────────────────────────────────"
test_endpoint "Health" "$WHATSAPP_URL/health"

# 2. WhatsApp Status
echo "2️⃣ WhatsApp Connection Status"
echo "─────────────────────────────────"
test_endpoint "Status" "$WHATSAPP_URL/status"

# 3. Backend Health
echo "3️⃣ Backend Health Check"
echo "─────────────────────────────────"
test_endpoint "Backend Health" "$BACKEND_URL/api/health"

# 4. Backend WhatsApp Health
echo "4️⃣ Backend WhatsApp Integration"
echo "─────────────────────────────────"
test_endpoint "WhatsApp Integration" "$BACKEND_URL/api/whatsapp/health"

# 5. Check if WhatsApp is ready
echo "5️⃣ WhatsApp Ready Status"
echo "─────────────────────────────────"
status_response=$(curl -s "$WHATSAPP_URL/status")
is_connected=$(echo "$status_response" | jq -r '.connected // false')
has_qr=$(echo "$status_response" | jq -r '.hasQR // false')

if [ "$is_connected" = "true" ]; then
  echo -e "${GREEN}✓ WhatsApp is CONNECTED${NC}"
  echo ""
  echo "You can now send and receive messages!"
elif [ "$has_qr" = "true" ]; then
  echo -e "${YELLOW}⚠ WhatsApp is NOT connected (QR available)${NC}"
  echo ""
  echo "To connect WhatsApp:"
  echo "1. Get QR code: curl $WHATSAPP_URL/qr"
  echo "2. Open WhatsApp on your phone"
  echo "3. Go to Settings → Linked Devices → Link a Device"
  echo "4. Scan the QR code"
else
  echo -e "${RED}✗ WhatsApp is NOT ready${NC}"
  echo ""
  echo "QR code is being generated. Please wait..."
  echo "Check again in a few seconds: curl $WHATSAPP_URL/qr"
fi

echo ""
echo "================================"
echo "Test completed!"
echo ""

# Summary
echo "📊 Summary:"
echo "─────────"
echo "WhatsApp Service: $WHATSAPP_URL"
echo "Backend API: $BACKEND_URL"
echo "Environment: $ENV"
echo ""

if [ "$is_connected" = "true" ]; then
  echo -e "${GREEN}Status: READY ✓${NC}"
  echo ""
  echo "🎉 All systems operational!"
else
  echo -e "${YELLOW}Status: SETUP REQUIRED${NC}"
  echo ""
  echo "📱 Next steps:"
  echo "1. Get QR code and scan with WhatsApp"
  echo "2. Wait for connection"
  echo "3. Run this script again to verify"
fi

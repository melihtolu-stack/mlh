#!/bin/bash

# Get WhatsApp QR Code Script
# Usage: ./scripts/get-whatsapp-qr.sh [production|local]

ENV=${1:-local}

if [ "$ENV" = "production" ]; then
  WHATSAPP_URL="https://whatsapp-mlh.heni.com.tr"
else
  WHATSAPP_URL="http://localhost:3001"
fi

echo "📱 WhatsApp QR Code Retrieval"
echo "Environment: $ENV"
echo "================================"
echo ""

# Check status first
echo "Checking WhatsApp connection status..."
status_response=$(curl -s "$WHATSAPP_URL/status")
is_connected=$(echo "$status_response" | jq -r '.connected // false')

if [ "$is_connected" = "true" ]; then
  echo "✅ WhatsApp is already connected!"
  echo ""
  echo "No QR code needed. You can start sending/receiving messages."
  exit 0
fi

echo ""
echo "Getting QR code..."
echo ""

# Get QR code
qr_response=$(curl -s "$WHATSAPP_URL/qr")
status=$(echo "$qr_response" | jq -r '.status // "unknown"')

if [ "$status" = "pending" ]; then
  qr_code=$(echo "$qr_response" | jq -r '.qr')
  
  echo "📱 QR Code Available!"
  echo ""
  echo "To connect WhatsApp:"
  echo "1. Open WhatsApp on your phone"
  echo "2. Go to: Settings → Linked Devices"
  echo "3. Tap 'Link a Device'"
  echo "4. Scan this QR code:"
  echo ""
  echo "════════════════════════════════"
  
  # Try to display QR in terminal (if qrencode is available)
  if command -v qrencode &> /dev/null; then
    echo "$qr_code" | qrencode -t ANSIUTF8
  else
    # Fallback: show the raw QR string
    echo "$qr_code"
    echo ""
    echo "💡 Tip: Install 'qrencode' to see QR in terminal:"
    echo "   brew install qrencode  # macOS"
    echo "   apt install qrencode   # Ubuntu/Debian"
  fi
  
  echo "════════════════════════════════"
  echo ""
  echo "Or open this URL in browser:"
  echo "$WHATSAPP_URL/qr"
  echo ""
  echo "Waiting for you to scan the QR code..."
  echo "This script will check every 5 seconds..."
  echo ""
  
  # Wait for connection
  for i in {1..60}; do
    sleep 5
    status_check=$(curl -s "$WHATSAPP_URL/status")
    is_now_connected=$(echo "$status_check" | jq -r '.connected // false')
    
    if [ "$is_now_connected" = "true" ]; then
      echo ""
      echo "🎉 Success! WhatsApp is now connected!"
      echo ""
      echo "You can now send and receive messages."
      exit 0
    else
      echo -n "."
    fi
  done
  
  echo ""
  echo "⏱️ Timeout reached. Please try again."
  echo "Run: ./scripts/get-whatsapp-qr.sh"

elif [ "$status" = "connected" ]; then
  echo "✅ WhatsApp is already connected!"
  echo ""
  echo "$(echo "$qr_response" | jq -r '.message')"

elif [ "$status" = "initializing" ]; then
  echo "⏳ WhatsApp is initializing..."
  echo ""
  echo "$(echo "$qr_response" | jq -r '.message')"
  echo ""
  echo "Please wait a few seconds and try again:"
  echo "  ./scripts/get-whatsapp-qr.sh"

else
  echo "❌ Error getting QR code"
  echo ""
  echo "Response:"
  echo "$qr_response" | jq .
  echo ""
  echo "Check if WhatsApp service is running:"
  echo "  curl $WHATSAPP_URL/health"
fi

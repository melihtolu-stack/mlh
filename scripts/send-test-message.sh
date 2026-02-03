#!/bin/bash

# Send Test WhatsApp Message
# Usage: ./scripts/send-test-message.sh <phone_number> [message] [production|local]

PHONE=$1
MESSAGE=${2:-"Test mesajı - MLH CRM WhatsApp Integration ✅"}
ENV=${3:-local}

if [ -z "$PHONE" ]; then
  echo "Usage: ./scripts/send-test-message.sh <phone_number> [message] [production|local]"
  echo ""
  echo "Example:"
  echo "  ./scripts/send-test-message.sh 905551234567"
  echo "  ./scripts/send-test-message.sh 905551234567 'Merhaba!' production"
  exit 1
fi

if [ "$ENV" = "production" ]; then
  WHATSAPP_URL="https://whatsapp-mlh.heni.com.tr"
else
  WHATSAPP_URL="http://localhost:3001"
fi

echo "📤 Sending WhatsApp Test Message"
echo "================================"
echo "Environment: $ENV"
echo "To: $PHONE"
echo "Message: $MESSAGE"
echo ""

# Check if WhatsApp is connected
status_response=$(curl -s "$WHATSAPP_URL/status")
is_connected=$(echo "$status_response" | jq -r '.connected // false')

if [ "$is_connected" != "true" ]; then
  echo "❌ WhatsApp is not connected!"
  echo ""
  echo "Please connect WhatsApp first:"
  echo "  ./scripts/get-whatsapp-qr.sh"
  exit 1
fi

echo "✅ WhatsApp is connected. Sending message..."
echo ""

# Send message
response=$(curl -s -X POST "$WHATSAPP_URL/send" \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$PHONE\",
    \"message\": \"$MESSAGE\",
    \"type\": \"text\"
  }")

success=$(echo "$response" | jq -r '.success // false')

if [ "$success" = "true" ]; then
  message_id=$(echo "$response" | jq -r '.messageId')
  timestamp=$(echo "$response" | jq -r '.timestamp')
  
  echo "✅ Message sent successfully!"
  echo ""
  echo "Message ID: $message_id"
  echo "Timestamp: $timestamp"
  echo ""
  echo "Check your WhatsApp to verify the message was delivered."
else
  error=$(echo "$response" | jq -r '.error // "Unknown error"')
  
  echo "❌ Failed to send message"
  echo ""
  echo "Error: $error"
  echo ""
  echo "Response:"
  echo "$response" | jq .
fi

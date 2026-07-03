#!/bin/bash

BASE_URL="http://localhost:3000"
COOKIE_JAR="/tmp/cookies.txt"

# Register and get token
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pdf@test.de",
    "password": "TestPassword123",
    "confirmPassword": "TestPassword123"
  }' \
  -c "$COOKIE_JAR" > /dev/null

# Create company
curl -s -X POST "$BASE_URL/api/company/setup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PDF Test GmbH",
    "hourlyRate": 60,
    "profitMargin": 20,
    "materialCost": 0,
    "fixedCosts": 2000,
    "taxRate": 0.19
  }' \
  -b "$COOKIE_JAR" > /dev/null

# Create offer
OFFER_ID=$(curl -s -X POST "$BASE_URL/api/offers" \
  -H "Content-Type: application/json" \
  -d '{"clientName": "PDF Kunde", "clientEmail": "kunde@pdf.de"}' \
  -b "$COOKIE_JAR" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Add position
curl -s -X POST "$BASE_URL/api/offers/$OFFER_ID/positions" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gehölzschnitt",
    "description": "Schnitt und Entsorgung",
    "quantity": 8,
    "unit": "h",
    "unitPrice": 60
  }' \
  -b "$COOKIE_JAR" > /dev/null

echo "🎯 Test PDF Generation"
echo "Offer ID: $OFFER_ID"

# Download PDF
PDF_FILE="/tmp/test-offer.pdf"
curl -s -X GET "$BASE_URL/api/offers/$OFFER_ID/pdf" \
  -b "$COOKIE_JAR" \
  -o "$PDF_FILE"

# Check if PDF was created
if [ -f "$PDF_FILE" ]; then
  FILE_SIZE=$(stat -f%z "$PDF_FILE" 2>/dev/null || stat -c%s "$PDF_FILE" 2>/dev/null)
  if [ "$FILE_SIZE" -gt 1000 ]; then
    echo "✅ PDF generiert: $FILE_SIZE bytes"
    # Check if it's a valid PDF
    head -c 4 "$PDF_FILE" | grep -q "^%PDF" && echo "✅ Valid PDF file" || echo "⚠️  File ist kein PDF"
  else
    echo "❌ PDF zu klein: $FILE_SIZE bytes"
  fi
else
  echo "❌ PDF nicht erstellt"
fi

echo ""
echo "✅ PDF Test Abgeschlossen!"

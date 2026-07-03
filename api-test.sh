#!/bin/bash

BASE_URL="http://localhost:3000"
COOKIE_JAR="/tmp/cookies.txt"

echo "🎯 Test 1: Landing Page"
curl -s "$BASE_URL" | grep -q "Angebotssoftware" && echo "✅ Landing Page geladen"

echo ""
echo "🎯 Test 2: Registration API"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@beispiel.de",
    "password": "TestPassword123",
    "confirmPassword": "TestPassword123"
  }' \
  -c "$COOKIE_JAR")

echo "$REGISTER_RESPONSE" | grep -q "erfolgreich" && echo "✅ User registriert" || echo "Response: $REGISTER_RESPONSE"

echo ""
echo "🎯 Test 3: Auth Me API"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" -b "$COOKIE_JAR")
echo "$ME_RESPONSE" | grep -q "test@beispiel.de" && echo "✅ Authentication funktioniert" || echo "Response: $ME_RESPONSE"

echo ""
echo "🎯 Test 4: Company Setup API"
COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/company/setup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grün & Gestalt GmbH",
    "hourlyRate": 75,
    "profitMargin": 25,
    "materialCost": 500,
    "fixedCosts": 3000,
    "taxRate": 0.19
  }' \
  -b "$COOKIE_JAR")

echo "$COMPANY_RESPONSE" | grep -q "GmbH" && echo "✅ Company erstellt" || echo "Response: $COMPANY_RESPONSE"

echo ""
echo "🎯 Test 5: Create Offer API"
OFFER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/offers" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Max Mustermann",
    "clientEmail": "max@example.com"
  }' \
  -b "$COOKIE_JAR")

OFFER_ID=$(echo "$OFFER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "$OFFER_RESPONSE" | grep -q '"id"' && echo "✅ Offer erstellt: $OFFER_ID" || echo "Response: $OFFER_RESPONSE"

echo ""
echo "🎯 Test 6: Add Position API"
if [ ! -z "$OFFER_ID" ]; then
  POSITION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/offers/$OFFER_ID/positions" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Rasenanlage",
      "description": "Ansaat und Düngung",
      "quantity": 50,
      "unit": "m²",
      "unitPrice": 25.50
    }' \
    -b "$COOKIE_JAR")

  echo "$POSITION_RESPONSE" | grep -q "Rasenanlage" && echo "✅ Position hinzugefügt" || echo "Response: $POSITION_RESPONSE"
fi

echo ""
echo "🎯 Test 7: Get Offer API"
if [ ! -z "$OFFER_ID" ]; then
  OFFER_GET=$(curl -s -X GET "$BASE_URL/api/offers/$OFFER_ID" -b "$COOKIE_JAR")
  echo "$OFFER_GET" | grep -q "Max Mustermann" && echo "✅ Offer abgerufen" || echo "Response: $OFFER_GET"
fi

echo ""
echo "🎯 Test 8: Create Amendment API"
if [ ! -z "$OFFER_ID" ]; then
  AMENDMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/offers/$OFFER_ID/amendments" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR")

  AMENDMENT_ID=$(echo "$AMENDMENT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "$AMENDMENT_RESPONSE" | grep -q '"id"' && echo "✅ Nachtrag erstellt: $AMENDMENT_ID" || echo "Response: $AMENDMENT_RESPONSE"
fi

echo ""
echo "✅✅✅ API TESTS KOMPLETT! ✅✅✅"

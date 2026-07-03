#!/bin/bash

BASE_URL="http://localhost:3000"
COOKIE_JAR="/tmp/cookies2.txt"

# Register and get token
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pdfdebug@test.de",
    "password": "TestPassword123",
    "confirmPassword": "TestPassword123"
  }' \
  -c "$COOKIE_JAR" > /dev/null

# Create company
curl -s -X POST "$BASE_URL/api/company/setup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PDF Debug GmbH",
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
  -d '{"clientName": "Debug Kunde", "clientEmail": "debug@pdf.de"}' \
  -b "$COOKIE_JAR" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Add position
curl -s -X POST "$BASE_URL/api/offers/$OFFER_ID/positions" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Position",
    "description": "Test",
    "quantity": 1,
    "unit": "h",
    "unitPrice": 50
  }' \
  -b "$COOKIE_JAR" > /dev/null

# Try PDF and capture error
curl -s -X GET "$BASE_URL/api/offers/$OFFER_ID/pdf" \
  -b "$COOKIE_JAR" -v 2>&1 | head -50

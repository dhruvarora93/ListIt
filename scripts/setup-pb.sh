#!/bin/bash
set -e

PB_URL="http://127.0.0.1:8090"

# Authenticate
echo "🔐 Authenticating..."
AUTH_RESPONSE=$(curl -s "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity":"dhruv.rarora14@gmail.com","password":"YHZMQuWSc5eusq6"}')
TOKEN=$(echo "$AUTH_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AUTH="Authorization: Bearer $TOKEN"
echo "✅ Authenticated"

# Helper
create_collection() {
  local result=$(curl -s -X POST "$PB_URL/api/collections" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$1")
  local id=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
  local msg=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message','ok'))" 2>/dev/null)
  if [ -z "$id" ]; then
    echo "    ❌ $msg"
    echo "    $result"
    return 1
  fi
  echo "    ✅ id=$id"
  echo "$id"
}

# ── Step 1: Create collections without relations ────────
echo ""
echo "📦 Creating collections (pass 1 — no relations)..."

echo "  → profiles"
create_collection '{
  "name": "profiles",
  "type": "base",
  "fields": [
    {"name": "handle", "type": "text", "required": true},
    {"name": "display_name", "type": "text", "required": true},
    {"name": "bio", "type": "text"},
    {"name": "avatar_url", "type": "url"}
  ],
  "indexes": ["CREATE UNIQUE INDEX idx_handle ON profiles (handle)"],
  "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
}' > /dev/null 2>&1 || true

echo "  → lists"
create_collection '{
  "name": "lists",
  "type": "base",
  "fields": [
    {"name": "title", "type": "text", "required": true},
    {"name": "description", "type": "text"},
    {"name": "category", "type": "select", "required": true, "options": {"values": ["food_drink","books","music","travel","shopping","custom"]}},
    {"name": "visibility", "type": "select", "required": true, "options": {"values": ["private","link_only","public"]}},
    {"name": "allow_save", "type": "bool"},
    {"name": "allow_remix", "type": "bool"},
    {"name": "slug", "type": "text", "required": true}
  ],
  "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
}' > /dev/null 2>&1 || true

echo "  → items"
create_collection '{
  "name": "items",
  "type": "base",
  "fields": [
    {"name": "name", "type": "text", "required": true},
    {"name": "note", "type": "text"},
    {"name": "rating", "type": "number"},
    {"name": "position", "type": "number", "required": true},
    {"name": "place_id", "type": "text"},
    {"name": "latitude", "type": "number"},
    {"name": "longitude", "type": "number"}
  ],
  "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
}' > /dev/null 2>&1 || true

echo "  → saves"
create_collection '{
  "name": "saves",
  "type": "base",
  "fields": [],
  "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
}' > /dev/null 2>&1 || true

# ── Step 2: Get collection IDs ──────────────────────────
echo ""
echo "🔗 Fetching collection IDs..."
PROFILES_ID=$(curl -s "$PB_URL/api/collections/profiles" -H "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
LISTS_ID=$(curl -s "$PB_URL/api/collections/lists" -H "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ITEMS_ID=$(curl -s "$PB_URL/api/collections/items" -H "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
SAVES_ID=$(curl -s "$PB_URL/api/collections/saves" -H "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "  profiles=$PROFILES_ID"
echo "  lists=$LISTS_ID"
echo "  items=$ITEMS_ID"
echo "  saves=$SAVES_ID"

# ── Step 3: Add relation fields ─────────────────────────
echo ""
echo "🔗 Adding relation fields (pass 2)..."

echo "  → lists: owner, remixed_from"
curl -s -X PATCH "$PB_URL/api/collections/lists" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"fields\": [
      {\"name\": \"owner\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$PROFILES_ID\", \"maxSelect\": 1}},
      {\"name\": \"title\", \"type\": \"text\", \"required\": true},
      {\"name\": \"description\", \"type\": \"text\"},
      {\"name\": \"category\", \"type\": \"select\", \"required\": true, \"options\": {\"values\": [\"food_drink\",\"books\",\"music\",\"travel\",\"shopping\",\"custom\"]}},
      {\"name\": \"visibility\", \"type\": \"select\", \"required\": true, \"options\": {\"values\": [\"private\",\"link_only\",\"public\"]}},
      {\"name\": \"allow_save\", \"type\": \"bool\"},
      {\"name\": \"allow_remix\", \"type\": \"bool\"},
      {\"name\": \"remixed_from\", \"type\": \"relation\", \"options\": {\"collectionId\": \"$LISTS_ID\", \"maxSelect\": 1}},
      {\"name\": \"slug\", \"type\": \"text\", \"required\": true}
    ]
  }" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'    {d.get(\"message\",\"ok\")}')"

echo "  → items: list"
curl -s -X PATCH "$PB_URL/api/collections/items" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"fields\": [
      {\"name\": \"list\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$LISTS_ID\", \"maxSelect\": 1}},
      {\"name\": \"name\", \"type\": \"text\", \"required\": true},
      {\"name\": \"note\", \"type\": \"text\"},
      {\"name\": \"rating\", \"type\": \"number\"},
      {\"name\": \"position\", \"type\": \"number\", \"required\": true},
      {\"name\": \"place_id\", \"type\": \"text\"},
      {\"name\": \"latitude\", \"type\": \"number\"},
      {\"name\": \"longitude\", \"type\": \"number\"}
    ]
  }" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'    {d.get(\"message\",\"ok\")}')"

echo "  → saves: user, list"
curl -s -X PATCH "$PB_URL/api/collections/saves" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"fields\": [
      {\"name\": \"user\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$PROFILES_ID\", \"maxSelect\": 1}},
      {\"name\": \"list\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$LISTS_ID\", \"maxSelect\": 1}}
    ],
    \"indexes\": [\"CREATE UNIQUE INDEX idx_user_list ON saves (user, list)\"]
  }" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'    {d.get(\"message\",\"ok\")}')"

echo ""
echo "✅ All collections created with relations!"

#!/usr/bin/env python3
"""Set up PocketBase collections and seed data for Listwell."""

import json
import urllib.request
import urllib.error

PB_URL = "http://127.0.0.1:8090"

def api(method, path, data=None, token=None):
    url = f"{PB_URL}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        return err

# ── Auth ────────────────────────────────────────────────
print("🔐 Authenticating...")
auth = api("POST", "/api/collections/_superusers/auth-with-password", {
    "identity": "dhruv.rarora14@gmail.com",
    "password": "YHZMQuWSc5eusq6"
})
TOKEN = auth["token"]
print("✅ Authenticated\n")

# ── Get existing collections ────────────────────────────
existing = api("GET", "/api/collections", token=TOKEN)
existing_names = {c["name"] for c in existing.get("items", [])}
print(f"Existing collections: {existing_names}\n")

# ── Helper ──────────────────────────────────────────────
def get_collection_id(name):
    result = api("GET", f"/api/collections/{name}", token=TOKEN)
    return result["id"]

# ── Get IDs for collections that already exist ──────────
PROFILES_ID = get_collection_id("profiles") if "profiles" in existing_names else None
LISTS_ID = get_collection_id("lists") if "lists" in existing_names else None
ITEMS_ID = get_collection_id("items") if "items" in existing_names else None
SAVES_ID = get_collection_id("saves") if "saves" in existing_names else None

print(f"  profiles={PROFILES_ID}")
print(f"  lists={LISTS_ID}")
print(f"  items={ITEMS_ID}")
print(f"  saves={SAVES_ID}")

# ── Update lists with all fields + relations ────────────
print("\n🔗 Updating collections with full schema...")

print("  → lists")
result = api("PATCH", "/api/collections/lists", {
    "fields": [
        {"name": "owner", "type": "relation", "required": True, "options": {"collectionId": PROFILES_ID, "maxSelect": 1}},
        {"name": "title", "type": "text", "required": True},
        {"name": "description", "type": "text"},
        {"name": "category", "type": "select", "required": True, "options": {"values": ["food_drink","books","music","travel","shopping","custom"]}},
        {"name": "visibility", "type": "select", "required": True, "options": {"values": ["private","link_only","public"]}},
        {"name": "allow_save", "type": "bool"},
        {"name": "allow_remix", "type": "bool"},
        {"name": "remixed_from", "type": "relation", "options": {"collectionId": LISTS_ID, "maxSelect": 1}},
        {"name": "slug", "type": "text", "required": True},
    ]
}, token=TOKEN)
print(f"    {result.get('message', 'ok')}")

print("  → items")
result = api("PATCH", "/api/collections/items", {
    "fields": [
        {"name": "list", "type": "relation", "required": True, "options": {"collectionId": LISTS_ID, "maxSelect": 1}},
        {"name": "name", "type": "text", "required": True},
        {"name": "note", "type": "text"},
        {"name": "rating", "type": "number"},
        {"name": "position", "type": "number", "required": True},
        {"name": "place_id", "type": "text"},
        {"name": "latitude", "type": "number"},
        {"name": "longitude", "type": "number"},
    ]
}, token=TOKEN)
print(f"    {result.get('message', 'ok')}")

print("  → saves")
result = api("PATCH", "/api/collections/saves", {
    "fields": [
        {"name": "user", "type": "relation", "required": True, "options": {"collectionId": PROFILES_ID, "maxSelect": 1}},
        {"name": "list", "type": "relation", "required": True, "options": {"collectionId": LISTS_ID, "maxSelect": 1}},
    ],
    "indexes": ["CREATE UNIQUE INDEX idx_user_list ON saves (user, list)"]
}, token=TOKEN)
print(f"    {result.get('message', 'ok')}")

print("\n✅ Schema complete!")

# ── Seed Data ───────────────────────────────────────────
print("\n🌱 Seeding data...")

def create_record(collection, data):
    result = api("POST", f"/api/collections/{collection}/records", data, token=TOKEN)
    if "id" in result:
        return result["id"]
    else:
        print(f"    ❌ {collection}: {result}")
        return None

# Profiles
print("  → profiles")
profiles = {}
profile_data = [
    {"handle": "dhruv", "display_name": "Dhruv Arora", "bio": "Foodie, reader, traveler. Curating the best recommendations.", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=dhruv"},
    {"handle": "sarah_eats", "display_name": "Sarah Chen", "bio": "SF food explorer 🍜", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah"},
    {"handle": "bookworm_alex", "display_name": "Alex Rivera", "bio": "Reading my way through life 📚", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=alex"},
]
for p in profile_data:
    pid = create_record("profiles", p)
    profiles[p["handle"]] = pid
    print(f"    {p['handle']} → {pid}")

# Lists
print("  → lists")
list_ids = {}
list_data = [
    {"key": "coffee", "owner": profiles["dhruv"], "title": "Best Coffee Shops in SF", "description": "My favorite spots for coffee in San Francisco, tried and tested.", "category": "food_drink", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "best-coffee-shops-sf"},
    {"key": "scifi", "owner": profiles["dhruv"], "title": "Must-Read Sci-Fi Books", "description": "Essential science fiction for anyone getting into the genre.", "category": "books", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "must-read-scifi"},
    {"key": "tokyo", "owner": profiles["dhruv"], "title": "Tokyo Travel Essentials", "description": "Everything you need to know for a first trip to Tokyo.", "category": "travel", "visibility": "link_only", "allow_save": True, "allow_remix": False, "slug": "tokyo-essentials"},
    {"key": "grocery", "owner": profiles["dhruv"], "title": "Weekly Grocery Staples", "description": "My go-to grocery list.", "category": "shopping", "visibility": "private", "allow_save": False, "allow_remix": False, "slug": "grocery-staples"},
    {"key": "ramen", "owner": profiles["sarah_eats"], "title": "SF Ramen Ranking", "description": "Every ramen spot in SF, ranked.", "category": "food_drink", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "sf-ramen-ranking"},
    {"key": "tacos", "owner": profiles["sarah_eats"], "title": "Best Tacos in the Mission", "description": "A definitive taco guide for the Mission District.", "category": "food_drink", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "mission-tacos"},
    {"key": "reading", "owner": profiles["bookworm_alex"], "title": "2024 Reading List", "description": "Books I read this year with mini reviews.", "category": "books", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "2024-reading-list"},
    {"key": "indie", "owner": profiles["bookworm_alex"], "title": "Indie Albums That Slap", "description": "Underground gems from 2024.", "category": "music", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "indie-albums-2024"},
]
for l in list_data:
    key = l.pop("key")
    lid = create_record("lists", l)
    list_ids[key] = lid
    print(f"    {key} → {lid}")

# Items
print("  → items")
items_data = [
    # Coffee
    {"list": list_ids["coffee"], "name": "Sightglass Coffee", "note": "Amazing pour-over, great vibes", "rating": 9.5, "position": 1, "latitude": 37.7725, "longitude": -122.4099},
    {"list": list_ids["coffee"], "name": "Ritual Coffee Roasters", "note": "OG SF coffee spot", "rating": 9.0, "position": 2, "latitude": 37.7563, "longitude": -122.4212},
    {"list": list_ids["coffee"], "name": "Philz Coffee", "note": "Mint Mojito Iced Coffee is legendary", "rating": 8.5, "position": 3, "latitude": 37.7644, "longitude": -122.4218},
    {"list": list_ids["coffee"], "name": "Blue Bottle Coffee", "note": "Clean, minimal, great espresso", "rating": 8.0, "position": 4, "latitude": 37.7823, "longitude": -122.4078},
    {"list": list_ids["coffee"], "name": "Verve Coffee", "note": "Santa Cruz vibes in the city", "rating": 8.5, "position": 5, "latitude": 37.7843, "longitude": -122.4090},
    # Sci-fi
    {"list": list_ids["scifi"], "name": "Dune — Frank Herbert", "note": "The greatest sci-fi novel ever written", "rating": 10, "position": 1},
    {"list": list_ids["scifi"], "name": "Neuromancer — William Gibson", "note": "Cyberpunk origin story", "rating": 9.0, "position": 2},
    {"list": list_ids["scifi"], "name": "The Left Hand of Darkness — Ursula K. Le Guin", "note": "Mind-bending gender politics", "rating": 9.5, "position": 3},
    {"list": list_ids["scifi"], "name": "Foundation — Isaac Asimov", "note": "Epic in scope", "rating": 8.5, "position": 4},
    # Tokyo
    {"list": list_ids["tokyo"], "name": "Tsukiji Outer Market", "note": "Go early for the freshest sushi", "rating": 9.0, "position": 1, "latitude": 35.6654, "longitude": 139.7707},
    {"list": list_ids["tokyo"], "name": "Shibuya Crossing", "note": "Iconic, best viewed from Starbucks above", "rating": 8.0, "position": 2, "latitude": 35.6595, "longitude": 139.7004},
    {"list": list_ids["tokyo"], "name": "TeamLab Borderless", "note": "Book tickets way in advance", "rating": 9.5, "position": 3, "latitude": 35.6268, "longitude": 139.7839},
    # Grocery
    {"list": list_ids["grocery"], "name": "Sourdough bread", "note": "From Tartine if splurging", "position": 1},
    {"list": list_ids["grocery"], "name": "Eggs (pasture raised)", "note": "Vital Farms", "position": 2},
    {"list": list_ids["grocery"], "name": "Avocados", "note": "Check for ripeness", "position": 3},
    # Ramen
    {"list": list_ids["ramen"], "name": "Marufuku Ramen", "note": "Best tonkotsu in the city, expect a wait", "rating": 9.5, "position": 1, "latitude": 37.7855, "longitude": -122.4108},
    {"list": list_ids["ramen"], "name": "Mensho Tokyo", "note": "Tori Paitan is incredible", "rating": 9.0, "position": 2, "latitude": 37.7732, "longitude": -122.4173},
    {"list": list_ids["ramen"], "name": "Ramen Nagi", "note": "Customizable bowls, butao king is the move", "rating": 8.5, "position": 3, "latitude": 37.7857, "longitude": -122.4095},
    # Tacos
    {"list": list_ids["tacos"], "name": "La Taqueria", "note": "No rice, just meat and salsa. Perfect.", "rating": 9.5, "position": 1, "latitude": 37.7509, "longitude": -122.4180},
    {"list": list_ids["tacos"], "name": "El Farolito", "note": "Late night super burrito legend", "rating": 9.0, "position": 2, "latitude": 37.7527, "longitude": -122.4183},
    # Reading
    {"list": list_ids["reading"], "name": "Tomorrow, and Tomorrow, and Tomorrow", "note": "Beautiful story about creativity and friendship", "rating": 9.5, "position": 1},
    {"list": list_ids["reading"], "name": "The Covenant of Water", "note": "Sweeping family saga, stunning prose", "rating": 9.0, "position": 2},
    {"list": list_ids["reading"], "name": "Demon Copperhead", "note": "Modern Dickens, heartbreaking", "rating": 8.5, "position": 3},
    # Indie
    {"list": list_ids["indie"], "name": "Brat — Charli XCX", "note": "360 is the song of the summer", "rating": 9.0, "position": 1},
    {"list": list_ids["indie"], "name": "GNX — Kendrick Lamar", "note": "Instant classic", "rating": 9.5, "position": 2},
    {"list": list_ids["indie"], "name": "Bright Future — Adrianne Lenker", "note": "Raw, intimate folk perfection", "rating": 9.0, "position": 3},
]
for item in items_data:
    iid = create_record("items", item)
    print(f"    {item['name'][:30]}... → {iid}")

# Saves
print("  → saves")
saves_data = [
    {"user": profiles["dhruv"], "list": list_ids["ramen"]},
    {"user": profiles["dhruv"], "list": list_ids["reading"]},
    {"user": profiles["sarah_eats"], "list": list_ids["coffee"]},
    {"user": profiles["sarah_eats"], "list": list_ids["scifi"]},
    {"user": profiles["bookworm_alex"], "list": list_ids["coffee"]},
    {"user": profiles["bookworm_alex"], "list": list_ids["ramen"]},
]
for s in saves_data:
    sid = create_record("saves", s)
    print(f"    {s['user']} saved {s['list']} → {sid}")

print("\n🎉 Done! PocketBase is fully set up and seeded.")
print(f"\n📋 Profile IDs: {json.dumps(profiles, indent=2)}")
print(f"📋 List IDs: {json.dumps(list_ids, indent=2)}")

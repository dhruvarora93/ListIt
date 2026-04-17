#!/usr/bin/env python3
"""Delete all records and re-seed with correct relation data."""

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
            body = resp.read()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        return err

# Auth
print("🔐 Authenticating...")
auth = api("POST", "/api/collections/_superusers/auth-with-password", {
    "identity": "dhruv.rarora14@gmail.com",
    "password": "YHZMQuWSc5eusq6"
})
TOKEN = auth["token"]

# Delete all records in reverse dependency order
for col in ["saves", "items", "lists", "profiles"]:
    print(f"🗑️  Clearing {col}...")
    records = api("GET", f"/api/collections/{col}/records?perPage=500", token=TOKEN)
    for r in records.get("items", []):
        api("DELETE", f"/api/collections/{col}/records/{r['id']}", token=TOKEN)
    print(f"    Deleted {len(records.get('items', []))} records")

# Re-seed
print("\n🌱 Seeding...")

def create(collection, data):
    result = api("POST", f"/api/collections/{collection}/records", data, token=TOKEN)
    if "id" in result:
        return result["id"]
    print(f"  ❌ {collection}: {result}")
    return None

# Profiles
print("  → profiles")
profiles = {}
for p in [
    {"handle": "dhruv", "display_name": "Dhruv Arora", "bio": "Foodie, reader, traveler. Curating the best recommendations.", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=dhruv"},
    {"handle": "sarah_eats", "display_name": "Sarah Chen", "bio": "SF food explorer 🍜", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah"},
    {"handle": "bookworm_alex", "display_name": "Alex Rivera", "bio": "Reading my way through life 📚", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=alex"},
]:
    pid = create("profiles", p)
    profiles[p["handle"]] = pid
    print(f"    {p['handle']} → {pid}")

# Lists
print("  → lists")
lids = {}
for l in [
    {"key": "coffee", "owner": profiles["dhruv"], "title": "Best Coffee Shops in SF", "description": "My favorite spots for coffee in San Francisco, tried and tested.", "category": "food_drink", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "best-coffee-shops-sf"},
    {"key": "scifi", "owner": profiles["dhruv"], "title": "Must-Read Sci-Fi Books", "description": "Essential science fiction for anyone getting into the genre.", "category": "books", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "must-read-scifi"},
    {"key": "tokyo", "owner": profiles["dhruv"], "title": "Tokyo Travel Essentials", "description": "Everything you need to know for a first trip to Tokyo.", "category": "travel", "visibility": "link_only", "allow_save": True, "allow_remix": False, "slug": "tokyo-essentials"},
    {"key": "grocery", "owner": profiles["dhruv"], "title": "Weekly Grocery Staples", "description": "My go-to grocery list.", "category": "shopping", "visibility": "private", "allow_save": False, "allow_remix": False, "slug": "grocery-staples"},
    {"key": "ramen", "owner": profiles["sarah_eats"], "title": "SF Ramen Ranking", "description": "Every ramen spot in SF, ranked.", "category": "food_drink", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "sf-ramen-ranking"},
    {"key": "tacos", "owner": profiles["sarah_eats"], "title": "Best Tacos in the Mission", "description": "A definitive taco guide for the Mission District.", "category": "food_drink", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "mission-tacos"},
    {"key": "reading", "owner": profiles["bookworm_alex"], "title": "2024 Reading List", "description": "Books I read this year with mini reviews.", "category": "books", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "2024-reading-list"},
    {"key": "indie", "owner": profiles["bookworm_alex"], "title": "Indie Albums That Slap", "description": "Underground gems from 2024.", "category": "music", "visibility": "public", "allow_save": True, "allow_remix": True, "slug": "indie-albums-2024"},
]:
    key = l.pop("key")
    lid = create("lists", l)
    lids[key] = lid
    print(f"    {key} → {lid}")

# Items
print("  → items")
items = [
    {"list": lids["coffee"], "name": "Sightglass Coffee", "note": "Amazing pour-over, great vibes", "rating": 9.5, "position": 1, "latitude": 37.7725, "longitude": -122.4099},
    {"list": lids["coffee"], "name": "Ritual Coffee Roasters", "note": "OG SF coffee spot", "rating": 9.0, "position": 2, "latitude": 37.7563, "longitude": -122.4212},
    {"list": lids["coffee"], "name": "Philz Coffee", "note": "Mint Mojito Iced Coffee is legendary", "rating": 8.5, "position": 3, "latitude": 37.7644, "longitude": -122.4218},
    {"list": lids["coffee"], "name": "Blue Bottle Coffee", "note": "Clean, minimal, great espresso", "rating": 8.0, "position": 4, "latitude": 37.7823, "longitude": -122.4078},
    {"list": lids["coffee"], "name": "Verve Coffee", "note": "Santa Cruz vibes in the city", "rating": 8.5, "position": 5, "latitude": 37.7843, "longitude": -122.4090},
    {"list": lids["scifi"], "name": "Dune — Frank Herbert", "note": "The greatest sci-fi novel ever written", "rating": 10, "position": 1},
    {"list": lids["scifi"], "name": "Neuromancer — William Gibson", "note": "Cyberpunk origin story", "rating": 9.0, "position": 2},
    {"list": lids["scifi"], "name": "The Left Hand of Darkness — Ursula K. Le Guin", "note": "Mind-bending gender politics", "rating": 9.5, "position": 3},
    {"list": lids["scifi"], "name": "Foundation — Isaac Asimov", "note": "Epic in scope", "rating": 8.5, "position": 4},
    {"list": lids["tokyo"], "name": "Tsukiji Outer Market", "note": "Go early for the freshest sushi", "rating": 9.0, "position": 1, "latitude": 35.6654, "longitude": 139.7707},
    {"list": lids["tokyo"], "name": "Shibuya Crossing", "note": "Iconic, best viewed from Starbucks above", "rating": 8.0, "position": 2, "latitude": 35.6595, "longitude": 139.7004},
    {"list": lids["tokyo"], "name": "TeamLab Borderless", "note": "Book tickets way in advance", "rating": 9.5, "position": 3, "latitude": 35.6268, "longitude": 139.7839},
    {"list": lids["grocery"], "name": "Sourdough bread", "note": "From Tartine if splurging", "position": 1},
    {"list": lids["grocery"], "name": "Eggs (pasture raised)", "note": "Vital Farms", "position": 2},
    {"list": lids["grocery"], "name": "Avocados", "note": "Check for ripeness", "position": 3},
    {"list": lids["ramen"], "name": "Marufuku Ramen", "note": "Best tonkotsu in the city, expect a wait", "rating": 9.5, "position": 1, "latitude": 37.7855, "longitude": -122.4108},
    {"list": lids["ramen"], "name": "Mensho Tokyo", "note": "Tori Paitan is incredible", "rating": 9.0, "position": 2, "latitude": 37.7732, "longitude": -122.4173},
    {"list": lids["ramen"], "name": "Ramen Nagi", "note": "Customizable bowls, butao king is the move", "rating": 8.5, "position": 3, "latitude": 37.7857, "longitude": -122.4095},
    {"list": lids["tacos"], "name": "La Taqueria", "note": "No rice, just meat and salsa. Perfect.", "rating": 9.5, "position": 1, "latitude": 37.7509, "longitude": -122.4180},
    {"list": lids["tacos"], "name": "El Farolito", "note": "Late night super burrito legend", "rating": 9.0, "position": 2, "latitude": 37.7527, "longitude": -122.4183},
    {"list": lids["reading"], "name": "Tomorrow, and Tomorrow, and Tomorrow", "note": "Beautiful story about creativity and friendship", "rating": 9.5, "position": 1},
    {"list": lids["reading"], "name": "The Covenant of Water", "note": "Sweeping family saga, stunning prose", "rating": 9.0, "position": 2},
    {"list": lids["reading"], "name": "Demon Copperhead", "note": "Modern Dickens, heartbreaking", "rating": 8.5, "position": 3},
    {"list": lids["indie"], "name": "Brat — Charli XCX", "note": "360 is the song of the summer", "rating": 9.0, "position": 1},
    {"list": lids["indie"], "name": "GNX — Kendrick Lamar", "note": "Instant classic", "rating": 9.5, "position": 2},
    {"list": lids["indie"], "name": "Bright Future — Adrianne Lenker", "note": "Raw, intimate folk perfection", "rating": 9.0, "position": 3},
]
for item in items:
    iid = create("items", item)
    print(f"    {item['name'][:35]:35s} → {iid}")

# Saves
print("  → saves")
for s in [
    {"user": profiles["dhruv"], "list": lids["ramen"]},
    {"user": profiles["dhruv"], "list": lids["reading"]},
    {"user": profiles["sarah_eats"], "list": lids["coffee"]},
    {"user": profiles["sarah_eats"], "list": lids["scifi"]},
    {"user": profiles["bookworm_alex"], "list": lids["coffee"]},
    {"user": profiles["bookworm_alex"], "list": lids["ramen"]},
]:
    sid = create("saves", s)
    print(f"    save → {sid}")

# Verify
print("\n✅ Verifying...")
lists_check = api("GET", "/api/collections/lists/records?expand=owner", token=TOKEN)
for r in lists_check.get("items", []):
    owner_name = r.get("expand", {}).get("owner", {}).get("display_name", "?")
    print(f"  {r['title']:35s} owner={owner_name}")

print("\n🎉 Done!")

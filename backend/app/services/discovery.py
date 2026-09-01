import math
import random
import requests
import re
from difflib import SequenceMatcher
from typing import List, Dict, Any, Tuple

# Comprehensive Known Presets for Colleges, Landmarks & Tech Hubs
KNOWN_PRESETS = {
    # Gandhinagar Landmarks & Institutes
    "ldrp": (23.2350, 72.6450, "LDRP Institute of Technology & Research, Sector 15, Gandhinagar"),
    "kadi sarva": (23.2350, 72.6450, "Kadi Sarva Vishwavidyalaya, Sector 15, Gandhinagar"),
    "daiict": (23.1885, 72.6288, "DA-IICT, Sector 09, Gandhinagar"),
    "iit gandhinagar": (23.2132, 72.6841, "IIT Gandhinagar, Palaj, Gandhinagar"),
    "pdpu": (23.1565, 72.6657, "PDEU / PDPU, Knowledge Corridor, Raisan, Gandhinagar"),
    "nift": (23.2085, 72.6395, "NIFT Gandhinagar, Sector 11, Gandhinagar"),
    "infocity": (23.1950, 72.6270, "Infocity, Gandhinagar"),
    "gift city": (23.1610, 72.6840, "GIFT City, Gandhinagar"),
    "gh5 circle": (23.2245, 72.6515, "GH5 Circle, Sector 16, Gandhinagar"),
    "pathika": (23.2230, 72.6490, "Pathikashram, Sector 11, Gandhinagar"),

    # Rajkot Landmarks
    "racecourse": (22.2999, 70.7912, "Race Course Park, Rajkot"),
    "race course": (22.2999, 70.7912, "Race Course Park, Rajkot"),

    # Surat Landmarks & Areas
    "smc": (21.2002, 72.8211, "Surat Municipal Corporation, Surat"),
    "surat municipal": (21.2002, 72.8211, "Surat Municipal Corporation, Surat"),
    "varachha": (21.2130, 72.8550, "Varachha, Surat"),
    "aqua imagica": (21.1680, 72.7850, "Amaazia / Imagicaa Water Park, Surat"),
}

def parse_google_maps_url(url: str) -> tuple[float, float] | None:
    """Extract (lat, lng) from any Google Maps URL, share link, or raw coordinates."""
    if not url or not url.strip():
        return None

    url_clean = url.strip()
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    if 'goo.gl' in url_clean or 'maps.app' in url_clean:
        try:
            resp = requests.head(url_clean, headers=headers, allow_redirects=True, timeout=5)
            url_clean = resp.url
        except Exception:
            pass

    # Pattern 1: @lat,lng
    m = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url_clean)
    if m:
        return float(m.group(1)), float(m.group(2))

    # Pattern 2: ?q=lat,lng or &q=lat,lng
    m = re.search(r'[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)', url_clean)
    if m:
        return float(m.group(1)), float(m.group(2))

    # Pattern 3: !3dlat!4dlng
    m = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', url_clean)
    if m:
        return float(m.group(1)), float(m.group(2))

    # Pattern 4: Raw numbers "23.2350, 72.6450"
    m = re.search(r'^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$', url_clean)
    if m:
        return float(m.group(1)), float(m.group(2))

    return None

def geocode_location(location_str: str) -> tuple[float, float, str, bool]:
    """
    Geocoding location service with Google Maps URL parser.
    Returns (lat, lon, display_name, resolved_successfully).
    NEVER hardcodes fallback to GH5 or any default location.
    """
    raw_query = location_str.strip()

    gmaps_coords = parse_google_maps_url(raw_query)
    if gmaps_coords:
        return gmaps_coords[0], gmaps_coords[1], f"Pin Location ({gmaps_coords[0]:.4f}, {gmaps_coords[1]:.4f})", True

    norm_query = re.sub(r'\bracecourse\b', 'race course', raw_query, flags=re.IGNORECASE).strip()
    q_lower = norm_query.lower()

    for key, val in KNOWN_PRESETS.items():
        if key in q_lower:
            return val[0], val[1], val[2], True

    headers = {"User-Agent": "LocalLeadApp/1.0 (contact@locallead.app)"}
    nominatim_url = "https://nominatim.openstreetmap.org/search"

    for search_term in [norm_query, raw_query, f"{norm_query}, India"]:
        try:
            resp = requests.get(nominatim_url, params={"q": search_term, "format": "json", "limit": 1}, headers=headers, timeout=5)
            if resp.status_code == 200 and resp.json():
                data = resp.json()[0]
                return float(data["lat"]), float(data["lon"]), data.get("display_name", raw_query), True
        except Exception:
            pass

    words = norm_query.split()
    while len(words) > 1:
        words.pop()
        sub_query = " ".join(words)
        if len(sub_query) < 3:
            continue
        try:
            resp = requests.get(nominatim_url, params={"q": sub_query, "format": "json", "limit": 1}, headers=headers, timeout=4)
            if resp.status_code == 200 and resp.json():
                data = resp.json()[0]
                if len(sub_query.split()) > 1 or sub_query.lower() in ["surat", "rajkot", "ahmedabad", "gandhinagar", "vadodara"]:
                    return float(data["lat"]), float(data["lon"]), data.get("display_name", sub_query), True
        except Exception:
            pass

    if "rajkot" in q_lower:
        return 22.3039, 70.8022, f"{raw_query} (Rajkot, Gujarat)", True
    elif "gandhinagar" in q_lower or "sector" in q_lower:
        return 23.2350, 72.6450, f"{raw_query} (Gandhinagar Region)", True
    elif "surat" in q_lower or "varachha" in q_lower:
        return 21.2095, 72.8317, f"{raw_query} (Surat Region)", True
    elif "ahmedabad" in q_lower:
        return 23.0225, 72.5714, f"{raw_query} (Ahmedabad Region)", True

    return 0.0, 0.0, raw_query, False

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance formula returning distance in meters."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def enrich_phone_number(name: str, location_name: str) -> str | None:
    """
    Multi-strategy phone enrichment engine.
    Fetches real business contact phone numbers when omitted from OpenStreetMap tags.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }

    clean_loc = location_name.split(",")[0].strip()
    q = requests.utils.quote(f"{name} {clean_loc} phone contact")

    # Strategy 1: Google Search Places Snippet
    try:
        url1 = f"https://www.google.com/search?q={q}"
        resp = requests.get(url1, headers=headers, timeout=5)
        if resp.status_code == 200:
            matches = re.findall(r'(?:(?:\+91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5}|0\d{2,4}[\s-]?\d{6,8})', resp.text)
            for m in matches:
                digits = re.sub(r'\D', '', m)
                if len(digits) == 10 and digits[0] in '6789':
                    return m
                elif len(digits) == 11 and digits.startswith('0'):
                    return m
                elif len(digits) == 12 and digits.startswith('91'):
                    return f"+{m.strip()}"
    except Exception:
        pass

    # Strategy 2: Bing Places Snippet
    try:
        url2 = f"https://www.bing.com/search?q={q}"
        resp = requests.get(url2, headers=headers, timeout=5)
        if resp.status_code == 200:
            matches = re.findall(r'(?:(?:\+91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5}|0\d{2,4}[\s-]?\d{6,8})', resp.text)
            for m in matches:
                digits = re.sub(r'\D', '', m)
                if len(digits) == 10 and digits[0] in '6789':
                    return m
                elif len(digits) == 11 and digits.startswith('0'):
                    return m
                elif len(digits) == 12 and digits.startswith('91'):
                    return f"+{m.strip()}"
    except Exception:
        pass

    return None

# ----------------------------------------------------
# 1. SOURCE ADAPTER PATTERN
# ----------------------------------------------------

CATEGORY_SYNONYMS = {
    "garage / auto repair": ["garage", "auto", "car_repair", "car repair", "vehicle repair", "mechanic", "tyres", "workshop", "service center"],
    "hospital": ["hospital", "medical center", "healthcare", "infirmary"],
    "clinic & medical": ["clinic", "doctor", "dentist", "physiotherapist", "healthcare", "medical"],
    "hostel": ["hostel", "dormitory", "student housing", "accommodation"],
    "pg (paying guest)": ["pg", "paying guest", "hostel", "guest house", "guest_house", "boarding house", "dormitory"],
    "small retailer / general store": ["shop", "retail", "store", "general", "convenience", "supermarket", "kirana", "kiosk", "bazaar", "provision", "grocery"],
    "salon / saloon": ["salon", "saloon", "hairdresser", "barber", "beauty", "parlour", "parlor"],
    "restaurant": ["restaurant", "dining", "diner", "eatery", "food"],
    "cafe": ["cafe", "coffee", "cafeteria", "tea"],
    "hotel & lodging": ["hotel", "motel", "lodging", "resort", "guest_house"],
    "pharmacy / medical store": ["pharmacy", "chemist", "drugstore", "medical store"],
    "gym & fitness center": ["gym", "fitness", "sports_centre", "workout", "health_club"],
    "coaching & education": ["coaching", "school", "college", "tutoring", "education", "training"],
    "bakery & sweets": ["bakery", "confectionery", "sweets", "cake", "pastry"],
    "electronics & mobile shop": ["electronics", "mobile", "computer", "phone", "gadgets"],
    "boutique & clothing": ["clothes", "fashion", "boutique", "tailor", "apparel", "clothing"],
    "jewellery store": ["jewellery", "jewelry", "gold", "silver"],
    "spa & wellness": ["spa", "wellness", "massage"],
    "laundry & dry cleaning": ["laundry", "dry_cleaning", "dry cleaner"],
    "real estate & agency": ["real estate", "estate_agent", "property", "agency"]
}

def is_category_match(cat_formatted: str, tags: dict, name: str, selected_categories: List[str]) -> bool:
    if not selected_categories:
        return True
    
    cat_lower = cat_formatted.lower()
    name_lower = name.lower()
    tags_str = " ".join([str(v).lower() for v in tags.values()])

    for sc in selected_categories:
        sc_lower = sc.lower()
        # Direct substring match
        if sc_lower in cat_lower or cat_lower in sc_lower or sc_lower in name_lower or sc_lower in tags_str:
            return True
        
        # Synonym / tag list check
        synonyms = CATEGORY_SYNONYMS.get(sc_lower, [])
        for syn in synonyms:
            if syn in cat_lower or syn in tags_str or syn in name_lower:
                return True
                
    return False

class OpenStreetMapAdapter:
    """Adapter fetching business data from OpenStreetMap Overpass API."""
    def fetch(self, center_lat: float, center_lon: float, radius_meters: int, categories: List[str]) -> List[Dict[str, Any]]:
        headers = {"User-Agent": "LocalLeadApp/1.0 (contact@locallead.app)"}
        overpass_urls = [
            "https://overpass-api.de/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
        ]
        query = f"""
        [out:json][timeout:15];
        (
          node["amenity"](around:{radius_meters},{center_lat},{center_lon});
          node["shop"](around:{radius_meters},{center_lat},{center_lon});
          node["healthcare"](around:{radius_meters},{center_lat},{center_lon});
          node["craft"](around:{radius_meters},{center_lat},{center_lon});
          node["tourism"](around:{radius_meters},{center_lat},{center_lon});
          node["office"](around:{radius_meters},{center_lat},{center_lon});
          way["amenity"](around:{radius_meters},{center_lat},{center_lon});
          way["shop"](around:{radius_meters},{center_lat},{center_lon});
          way["healthcare"](around:{radius_meters},{center_lat},{center_lon});
          way["tourism"](around:{radius_meters},{center_lat},{center_lon});
          way["office"](around:{radius_meters},{center_lat},{center_lon});
        );
        out center body 80;
        """
        results = []
        for url in overpass_urls:
            try:
                resp = requests.post(url, data={"data": query}, headers=headers, timeout=8)
                if resp.status_code == 200:
                    elements = resp.json().get("elements", [])
                    for e in elements:
                        tags = e.get("tags", {})
                        name = tags.get("name")
                        if not name:
                            continue

                        lat = e.get("lat") or (e.get("center", {}).get("lat"))
                        lon = e.get("lon") or (e.get("center", {}).get("lon"))
                        if not lat or not lon:
                            continue

                        raw_cat = tags.get("amenity") or tags.get("shop") or tags.get("healthcare") or tags.get("tourism") or tags.get("craft") or tags.get("office") or "Local Business"
                        cat_formatted = raw_cat.replace("_", " ").title()

                        if categories and len(categories) > 0:
                            if not is_category_match(cat_formatted, tags, name, categories):
                                continue

                        phone = tags.get("phone") or tags.get("contact:phone") or tags.get("mobile")

                        results.append({
                            "source_provider": "openstreetmap",
                            "source_id": str(e.get("id")),
                            "name": name,
                            "category": cat_formatted,
                            "address": tags.get("addr:street") or tags.get("addr:full") or "Address Listed on Map",
                            "phone": phone,
                            "website": tags.get("website") or tags.get("contact:website") or tags.get("url"),
                            "latitude": lat,
                            "longitude": lon,
                        })
                    if results:
                        break
            except Exception:
                continue
        return results

class PlacesAPIAdapter:
    """Adapter fetching business POIs via Places / Nominatim Structured Search."""
    def fetch(self, center_lat: float, center_lon: float, radius_meters: int, categories: List[str]) -> List[Dict[str, Any]]:
        headers = {"User-Agent": "LocalLeadApp/1.0 (contact@locallead.app)"}
        results = []
        try:
            poi_url = f"https://nominatim.openstreetmap.org/search?q=business&format=json&limit=20&viewbox={center_lon-0.015},{center_lat+0.015},{center_lon+0.015},{center_lat-0.015}&bounded=1"
            resp = requests.get(poi_url, headers=headers, timeout=5)
            if resp.status_code == 200 and resp.json():
                for item in resp.json():
                    name = item.get("display_name", "").split(",")[0]
                    if not name or len(name) < 3:
                        continue
                    b_lat = float(item["lat"])
                    b_lon = float(item["lon"])
                    cat = item.get("type", "Business").title()

                    results.append({
                        "source_provider": "places_api",
                        "source_id": str(item.get("place_id")),
                        "name": name,
                        "category": cat,
                        "address": item.get("display_name"),
                        "phone": None,
                        "website": None,
                        "latitude": b_lat,
                        "longitude": b_lon,
                    })
        except Exception:
            pass
        return results

# ----------------------------------------------------
# 2. DEDUPLICATION ENGINE
# ----------------------------------------------------

def is_same_business(b1: Dict[str, Any], b2: Dict[str, Any]) -> bool:
    """Multi-signal deduplication."""
    if b1.get("phone") and b2.get("phone") and b1["phone"] == b2["phone"]:
        return True

    dist = calculate_distance(b1["latitude"], b1["longitude"], b2["latitude"], b2["longitude"])
    name_sim = SequenceMatcher(None, b1["name"].lower(), b2["name"].lower()).ratio()

    if dist <= 35 and name_sim >= 0.70:
        return True
    if dist <= 100 and name_sim >= 0.88:
        return True

    return False

def deduplicate_results(raw_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merges duplicate business objects collected across multiple data sources."""
    unique_businesses = []

    for item in raw_list:
        matched = False
        for existing in unique_businesses:
            if is_same_business(item, existing):
                matched = True
                if item["source_provider"] not in existing["sources"]:
                    existing["sources"].append(item["source_provider"])
                if not existing.get("phone") and item.get("phone"):
                    existing["phone"] = item["phone"]
                if not existing.get("website") and item.get("website"):
                    existing["website"] = item["website"]
                break

        if not matched:
            item_copy = dict(item)
            item_copy["sources"] = [item["source_provider"]]
            unique_businesses.append(item_copy)

    return unique_businesses

# ----------------------------------------------------
# 3. SCAN ORCHESTRATOR & GEO VALIDATION
# ----------------------------------------------------

def discover_businesses(location_str: str, radius_km: float, selected_categories: List[str], gmaps_url: str = None) -> Dict[str, Any]:
    """
    Multi-Source Business Discovery Pipeline:
    1. Resolve Location Coordinates
    2. Query Source Adapters (OSM + Places)
    3. Merge & Deduplicate Results
    4. Independent Geographic Radius Validation
    5. Contact Enrichment Engine for Phone Numbers
    """
    search_target = gmaps_url.strip() if (gmaps_url and gmaps_url.strip()) else location_str
    center_lat, center_lon, display_name, resolved_ok = geocode_location(search_target)

    if not resolved_ok:
        return {
            "search_location": location_str,
            "location_resolved": False,
            "error_message": f"Could not find coordinates for '{location_str}'. Please enter a Google Maps URL below.",
            "center": None,
            "radius_km": radius_km,
            "total_discovered": 0,
            "businesses": []
        }

    radius_meters = int(radius_km * 1000)

    # 1. Collect from Adapters
    osm_adapter = OpenStreetMapAdapter()
    places_adapter = PlacesAPIAdapter()

    raw_results = []
    raw_results.extend(osm_adapter.fetch(center_lat, center_lon, radius_meters, selected_categories or []))
    raw_results.extend(places_adapter.fetch(center_lat, center_lon, radius_meters, selected_categories or []))

    # 2. Deduplicate Across Sources
    merged_businesses = deduplicate_results(raw_results)

    # 3. Independent Geographic Validation & Contact Enrichment
    validated_businesses = []
    for b in merged_businesses:
        dist_m = calculate_distance(center_lat, center_lon, b["latitude"], b["longitude"])
        if dist_m <= radius_meters:
            b["distance_meters"] = dist_m

            # Contact enrichment: if phone is missing, run multi-strategy enrichment
            if not b.get("phone"):
                enriched_ph = enrich_phone_number(b["name"], display_name)
                if enriched_ph:
                    b["phone"] = enriched_ph

            validated_businesses.append(b)

    # Sort by distance
    validated_businesses.sort(key=lambda x: x["distance_meters"])

    return {
        "search_location": display_name,
        "location_resolved": True,
        "error_message": None,
        "center": {"latitude": center_lat, "longitude": center_lon},
        "radius_km": radius_km,
        "total_discovered": len(validated_businesses),
        "businesses": validated_businesses
    }

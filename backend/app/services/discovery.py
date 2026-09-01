import math
import random
import requests
import re
from typing import List, Dict, Any

# Comprehensive Known Presets for Colleges, Landmarks & Tech Hubs
KNOWN_PRESETS = {
    # Gandhinagar Landmarks & Institutes
    "ldrp": (23.2350, 72.6450, "LDRP Institute of Technology & Research, Sector 15, Gandhinagar"),
    "kadi sarva": (23.2350, 72.6450, "Kadi Sarva Vishwavidyalaya, Sector 15, Gandhinagar"),
    "daiict": (23.1885, 72.6288, "DA-IICT, Sector 09, Gandhinagar"),
    "iit gandhinagar": (23.2132, 72.6841, "IIT Gandhinagar, Palaj, Gandhinagar"),
    "pdpu": (23.1565, 72.6657, "PDEU / PDPU, Knowledge Corridor, Raisan, Gandhinagar"),
    "pdeu": (23.1565, 72.6657, "PDEU / PDPU, Knowledge Corridor, Raisan, Gandhinagar"),
    "nift": (23.2085, 72.6395, "NIFT Gandhinagar, Sector 11, Gandhinagar"),
    "infocity": (23.1950, 72.6270, "Infocity, Gandhinagar"),
    "gift city": (23.1610, 72.6840, "GIFT City, Gandhinagar"),
    "gh5 circle": (23.2245, 72.6515, "GH5 Circle, Sector 16, Gandhinagar"),
    "pathika": (23.2230, 72.6490, "Pathikashram, Sector 11, Gandhinagar"),

    # Rajkot Landmarks
    "racecourse": (22.2999, 70.7912, "Race Course Park, Rajkot"),
    "race course": (22.2999, 70.7912, "Race Course Park, Rajkot"),
    "kalawad road": (22.2850, 70.7720, "Kalawad Road, Rajkot"),

    # Surat Landmarks & Areas
    "smc": (21.2002, 72.8211, "Surat Municipal Corporation, Surat"),
    "surat municipal": (21.2002, 72.8211, "Surat Municipal Corporation, Surat"),
    "varachha": (21.2130, 72.8550, "Varachha, Surat"),
    "ring road surat": (21.1920, 72.8300, "Ring Road, Surat"),
    "aqua imagica": (21.1680, 72.7850, "Amaazia / Imagicaa Water Park, Surat"),
    "imagica": (21.1680, 72.7850, "Amaazia / Imagicaa Water Park, Surat"),
}

def normalize_query_words(q: str) -> str:
    """Normalize common concatenated landmark terms."""
    q = re.sub(r'\bracecourse\b', 'race course', q, flags=re.IGNORECASE)
    q = re.sub(r'\bbusstand\b', 'bus stand', q, flags=re.IGNORECASE)
    q = re.sub(r'\brailwaystation\b', 'railway station', q, flags=re.IGNORECASE)
    q = re.sub(r'\bringroad\b', 'ring road', q, flags=re.IGNORECASE)
    return q.strip()

def geocode_location(location_str: str) -> tuple[float, float, str]:
    """
    Multi-tier Geocoder:
    1. Presets.
    2. Nominatim Exact & Normalized Query.
    3. Progressive Truncation.
    4. Smart City Fallback.
    """
    raw_query = location_str.strip()
    norm_query = normalize_query_words(raw_query)
    q_lower = norm_query.lower()

    # Step 1: Check Presets
    for key, val in KNOWN_PRESETS.items():
        if key in q_lower:
            return val[0], val[1], val[2]

    headers = {"User-Agent": "LocalLeadApp/1.0 (contact@locallead.app)"}
    nominatim_url = "https://nominatim.openstreetmap.org/search"

    # Step 2: Direct Nominatim lookup (tries normalized query first, then raw)
    for search_term in [norm_query, raw_query, f"{norm_query}, Gujarat, India"]:
        try:
            resp = requests.get(nominatim_url, params={"q": search_term, "format": "json", "limit": 1}, headers=headers, timeout=5)
            if resp.status_code == 200 and resp.json():
                data = resp.json()[0]
                return float(data["lat"]), float(data["lon"]), data.get("display_name", raw_query)
        except Exception:
            pass

    # Step 3: Progressive right-to-left word truncation
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
                    return float(data["lat"]), float(data["lon"]), data.get("display_name", sub_query)
        except Exception:
            pass

    # Step 4: Smart City Context Fallback
    if "rajkot" in q_lower:
        return 22.3039, 70.8022, f"{raw_query} (Rajkot, Gujarat)"
    elif "gandhinagar" in q_lower or "sector" in q_lower or "ldrp" in q_lower or "college" in q_lower:
        return 23.2350, 72.6450, f"{raw_query} (Gandhinagar Region)"
    elif "surat" in q_lower or "varachha" in q_lower:
        return 21.2095, 72.8317, f"{raw_query} (Surat Region)"
    elif "ahmedabad" in q_lower:
        return 23.0225, 72.5714, f"{raw_query} (Ahmedabad Region)"

    # Default to Rajkot if Rajkot searched, else Gandhinagar
    return 23.2245, 72.6515, f"{raw_query} (Gandhinagar Center)"

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance formula returning distance in meters."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def discover_businesses(location_str: str, radius_km: float, selected_categories: List[str]) -> Dict[str, Any]:
    """
    Find real local businesses around geocoded location.
    """
    center_lat, center_lon, display_name = geocode_location(location_str)
    radius_meters = int(radius_km * 1000)

    discovered = []
    headers = {"User-Agent": "LocalLeadApp/1.0 (contact@locallead.app)"}

    # Query Overpass API
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
      way["amenity"](around:{radius_meters},{center_lat},{center_lon});
      way["shop"](around:{radius_meters},{center_lat},{center_lon});
      way["healthcare"](around:{radius_meters},{center_lat},{center_lon});
    );
    out center body 60;
    """

    for api_url in overpass_urls:
        try:
            resp = requests.post(api_url, data={"data": query}, headers=headers, timeout=8)
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

                    dist = calculate_distance(center_lat, center_lon, lat, lon)

                    raw_cat = tags.get("amenity") or tags.get("shop") or tags.get("healthcare") or tags.get("craft") or tags.get("tourism") or "Local Business"
                    cat_formatted = raw_cat.replace("_", " ").title()

                    if selected_categories and len(selected_categories) > 0:
                        matches = any(sc.lower() in cat_formatted.lower() or cat_formatted.lower() in sc.lower() for sc in selected_categories)
                        if not matches:
                            continue

                    website = tags.get("website") or tags.get("contact:website") or tags.get("url") or None
                    phone = tags.get("phone") or tags.get("contact:phone") or tags.get("mobile") or None
                    street = tags.get("addr:street") or tags.get("addr:full") or f"Near {location_str}"

                    discovered.append({
                        "name": name,
                        "category": cat_formatted,
                        "address": street,
                        "phone": phone,
                        "website": website,
                        "latitude": lat,
                        "longitude": lon,
                        "distance_meters": dist
                    })
                
                if len(discovered) > 0:
                    break
        except Exception:
            continue

    # Secondary Nominatim POI lookup if Overpass returned 0 elements
    if len(discovered) == 0:
        try:
            poi_url = f"https://nominatim.openstreetmap.org/search?q=business&format=json&limit=15&viewbox={center_lon-0.02},{center_lat+0.02},{center_lon+0.02},{center_lat-0.02}&bounded=1"
            resp = requests.get(poi_url, headers=headers, timeout=5)
            if resp.status_code == 200 and resp.json():
                for item in resp.json():
                    name = item.get("display_name", "").split(",")[0]
                    if not name:
                        continue
                    b_lat = float(item["lat"])
                    b_lon = float(item["lon"])
                    dist = calculate_distance(center_lat, center_lon, b_lat, b_lon)

                    discovered.append({
                        "name": name,
                        "category": item.get("type", "Business").title(),
                        "address": item.get("display_name", location_str),
                        "phone": None,
                        "website": None,
                        "latitude": b_lat,
                        "longitude": b_lon,
                        "distance_meters": dist
                    })
        except Exception:
            pass

    # Deduplicate by business name
    seen_names = set()
    unique_discovered = []
    for d in discovered:
        b_name_clean = d["name"].lower().strip()
        if b_name_clean not in seen_names:
            seen_names.add(b_name_clean)
            unique_discovered.append(d)

    unique_discovered.sort(key=lambda x: x["distance_meters"])

    return {
        "search_location": display_name,
        "center": {"latitude": center_lat, "longitude": center_lon},
        "radius_km": radius_km,
        "total_discovered": len(unique_discovered),
        "businesses": unique_discovered
    }

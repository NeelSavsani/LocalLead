import requests
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional

def audit_website(url: Optional[str]) -> Dict[str, Any]:
    """
    Audits a business website's presence and quality signals.
    Returns structured audit metrics and opportunity score.
    """
    if not url or url.strip() in ["", "None", "Not Found", "N/A"]:
        return {
            "has_website": False,
            "is_https": False,
            "is_mobile_friendly": False,
            "has_online_booking": False,
            "has_contact_form": False,
            "opportunity_score": 100,  # Maximum website sales opportunity!
            "audit_notes": "No official website found. Prime prospect for a new custom website build."
        }

    # Normalize URL scheme
    target_url = url.strip()
    if not target_url.startswith("http://") and not target_url.startswith("https://"):
        target_url = "https://" + target_url

    is_https = target_url.startswith("https://")
    is_mobile_friendly = False
    has_online_booking = False
    has_contact_form = False
    audit_notes = []

    # Free domain / blogspot / wordpress indicator
    is_free_subdomain = any(domain in target_url.lower() for domain in ["wordpress.com", "blogspot.com", "wixsite.com", "weebly.com", "business.site"])
    if is_free_subdomain:
        audit_notes.append("Uses basic free subdomain instead of custom domain.")

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(target_url, headers=headers, timeout=4, allow_redirects=True)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Check meta viewport for mobile friendliness
            viewport = soup.find("meta", attrs={"name": "viewport"})
            if viewport:
                is_mobile_friendly = True
            else:
                audit_notes.append("Missing viewport meta tag (likely poor mobile experience).")

            # Check for booking keywords
            page_text = soup.get_text().lower()
            booking_keywords = ["book now", "schedule appointment", "reservation", "book online", "appointment"]
            if any(kw in page_text for kw in booking_keywords):
                has_online_booking = True
            else:
                audit_notes.append("No online booking or appointment system detected.")

            # Check for contact form or WhatsApp button
            contact_elements = soup.find_all(["form", "a"], href=True)
            has_form = any(elem.name == "form" for elem in contact_elements)
            has_whatsapp = any("wa.me" in str(elem.get("href", "")) or "api.whatsapp.com" in str(elem.get("href", "")) for elem in contact_elements)
            
            if has_form or has_whatsapp or "contact" in page_text:
                has_contact_form = True
            else:
                audit_notes.append("No clear contact form or direct WhatsApp lead CTA.")
        else:
            audit_notes.append(f"Website returned HTTP status {resp.status_code}.")
    except Exception as e:
        audit_notes.append("Website load timed out or connection failed.")

    # Calculate Website Opportunity Score (0-100 where higher means better opportunity to sell an upgrade)
    opp_score = 0
    if not is_https:
        opp_score += 20
    if not is_mobile_friendly:
        opp_score += 25
    if not has_online_booking:
        opp_score += 20
    if not has_contact_form:
        opp_score += 15
    if is_free_subdomain:
        opp_score += 20

    opp_score = min(95, max(15, opp_score))

    notes_str = " | ".join(audit_notes) if audit_notes else "Website online with basic features."

    return {
        "has_website": True,
        "is_https": is_https,
        "is_mobile_friendly": is_mobile_friendly,
        "has_online_booking": has_online_booking,
        "has_contact_form": has_contact_form,
        "opportunity_score": opp_score,
        "audit_notes": notes_str
    }

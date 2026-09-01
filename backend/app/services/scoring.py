from typing import Dict, Any, Tuple

def calculate_two_scores(business_info: Dict[str, Any], audit_info: Dict[str, Any]) -> Tuple[int, int, str, str]:
    """
    Calculates:
    1. Data Confidence Score (0-100): Reliability & completeness of business information.
    2. Sales Opportunity Score (0-100): Commercial potential for selling a web/app build.
    3. Priority level (HIGH, MEDIUM, LOW)
    4. Digital Presence Status (NO_WEBSITE, WEBSITE_POOR, WEBSITE_GOOD, WEBSITE_VERIFIED)
    
    Returns (data_confidence, opportunity_score, priority, digital_presence_status).
    """
    # 1. Calculate Data Confidence Score
    confidence = 0
    if business_info.get("name"):
        confidence += 20
    if business_info.get("phone"):
        confidence += 25  # Verified direct contact number
    if business_info.get("address"):
        confidence += 20
    if business_info.get("latitude") and business_info.get("longitude"):
        confidence += 20

    # Multi-source validation bonus
    sources = business_info.get("sources", ["openstreetmap"])
    if len(sources) > 1:
        confidence += 15
    else:
        confidence += 5

    data_confidence = min(100, confidence)

    # 2. Calculate Sales Opportunity Score
    opp_score = 0
    has_web = audit_info.get("has_website", False)
    web_opp = audit_info.get("opportunity_score", 0)

    if not has_web:
        opp_score += 50
        digital_presence_status = "NO_WEBSITE"
    else:
        opp_score += int(web_opp * 0.40)
        if web_opp >= 50:
            digital_presence_status = "WEBSITE_POOR"
        elif audit_info.get("is_https") and audit_info.get("is_mobile_friendly"):
            digital_presence_status = "WEBSITE_GOOD"
        else:
            digital_presence_status = "WEBSITE_FOUND"

    if not audit_info.get("has_online_booking", True):
        opp_score += 10
    if not audit_info.get("has_contact_form", True):
        opp_score += 10

    if business_info.get("phone"):
        opp_score += 15  # Easily contactable by sales rep
    if business_info.get("address"):
        opp_score += 5

    dist_m = business_info.get("distance_meters", 1000)
    if dist_m <= 500:
        opp_score += 10
    elif dist_m <= 1500:
        opp_score += 5

    opportunity_score = min(100, opp_score)

    # Calculate priority using two-score matrix
    if opportunity_score >= 70 and data_confidence >= 50:
        priority = "HIGH"
    elif opportunity_score >= 45:
        priority = "MEDIUM"
    else:
        priority = "LOW"

    return data_confidence, opportunity_score, priority, digital_presence_status

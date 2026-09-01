from typing import Dict, Any, Tuple

def calculate_lead_score(business_info: Dict[str, Any], audit_info: Dict[str, Any]) -> Tuple[int, str]:
    """
    Calculates overall lead priority score (0-100+) and priority level.
    Returns (score, priority_level).
    """
    score = 0

    # Website status weighting
    has_web = audit_info.get("has_website", False)
    opp_score = audit_info.get("opportunity_score", 0)

    if not has_web:
        score += 50
    else:
        # Scale opportunity score (0 to 35 pts)
        score += int(opp_score * 0.35)

    # Online booking & lead CTA signals
    if not audit_info.get("has_online_booking", True):
        score += 10
    if not audit_info.get("has_contact_form", True):
        score += 10

    # Contactability bonus
    if business_info.get("phone"):
        score += 15  # Easily contactable by sales rep
    if business_info.get("address"):
        score += 5

    # Distance factor (closer businesses are easier to visit in person)
    dist_m = business_info.get("distance_meters", 1000)
    if dist_m <= 500:
        score += 10
    elif dist_m <= 1500:
        score += 5

    # Cap score at 100 max
    final_score = min(100, score)

    if final_score >= 70:
        priority = "HIGH"
    elif final_score >= 45:
        priority = "MEDIUM"
    else:
        priority = "LOW"

    return final_score, priority

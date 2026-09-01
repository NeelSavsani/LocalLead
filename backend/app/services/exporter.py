import io
import pandas as pd
from typing import List
from ..models import Lead

def export_leads_to_excel(leads: List[Lead]) -> bytes:
    """
    Exports a list of Lead ORM objects into a formatted multi-source Excel workbook (.xlsx).
    Returns binary content.
    """
    data = []
    for lead in leads:
        b = lead.business
        w = b.analysis if b else None

        data.append({
            "Lead ID": lead.lead_code,
            "Business Name": b.name if b else "N/A",
            "Category": b.category if b else "N/A",
            "Address": b.address if b else "N/A",
            "Phone": b.phone if b and b.phone else "Not Available",
            "Website": b.website if b and b.website else "No Website",
            "Digital Presence Status": w.digital_presence_status if w else "NO_WEBSITE",
            "Data Confidence Score (%)": getattr(lead, "data_confidence", 80),
            "Opportunity Score": lead.score,
            "Lead Priority": lead.priority,
            "Lead Status": lead.status,
            "Multi-Source Count": b.sources_count if b else 1,
            "Source Providers": b.source_providers if b else "openstreetmap",
            "Owner Name": lead.owner_name or "Unknown",
            "Estimated Budget": lead.estimated_budget or "N/A",
            "Call Notes": lead.call_notes or "N/A",
            "Distance (m)": b.distance_meters if b else 0,
            "Search Location": b.search_location if b else "N/A"
        })

    df = pd.DataFrame(data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="LocalLead Multi-Source Report")
        
        # Access openpyxl worksheet for column width formatting
        worksheet = writer.sheets["LocalLead Multi-Source Report"]
        for col in worksheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = col[0].column_letter
            worksheet.column_dimensions[col_letter].width = max(max_len + 3, 14)

    output.seek(0)
    return output.getvalue()

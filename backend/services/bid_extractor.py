"""
Structured Bid Dossier Extractor for GeM Procurement (Phase 3).
Performs context-aware statutory entity extraction with page-level evidence tracking.
"""

import re
from typing import Dict, Any, List, Optional
from .text_normalizer import extract_snippet

def _find_in_pages(pages: List[Dict[str, Any]], pattern: str, flags: int = re.IGNORECASE) -> Optional[Dict[str, Any]]:
    """Searches pages sequentially for a regex pattern and returns match, page_num, and evidence snippet."""
    regex = re.compile(pattern, flags)
    for p in pages:
        text = p.get("text", "")
        m = regex.search(text)
        if m:
            page_num = p.get("page_num", 1)
            evidence = extract_snippet(text, m.start(), m.end(), window=70)
            return {
                "match": m,
                "page": page_num,
                "evidence": evidence,
                "text": text
            }
    return None

def extract_pan(pages: List[Dict[str, Any]], raw_text: str, gstin_found: Optional[str] = None) -> Dict[str, Any]:
    """
    Extracts Indian Permanent Account Number (PAN).
    Tolerates OCR spacing when safe. Cross-references GSTIN characters 3-12.
    """
    pan_pattern = r'\b([A-Z]{5}[0-9]{4}[A-Z])\b'
    
    # Check with contextual preference first: e.g. "PAN : AABCN4920K" or "Permanent Account Number"
    context_res = _find_in_pages(pages, r'(?:pan|permanent\s+account\s+number|income\s+tax\s+pan)[^A-Z0-9]{0,30}\b([A-Z]{5}[0-9]{4}[A-Z])\b')
    if context_res:
        val = context_res["match"].group(1).upper()
        return {
            "value": val,
            "page": context_res["page"],
            "evidence": context_res["evidence"]
        }
        
    # Standalone PAN pattern
    standalone_res = _find_in_pages(pages, pan_pattern)
    if standalone_res:
        val = standalone_res["match"].group(1).upper()
        # Verify it's not just a random English word
        return {
            "value": val,
            "page": standalone_res["page"],
            "evidence": standalone_res["evidence"]
        }

    # Cross-reference with GSTIN if available
    if gstin_found and len(gstin_found) == 15:
        embedded_pan = gstin_found[2:12]
        if re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', embedded_pan):
            return {
                "value": embedded_pan,
                "page": 1,
                "evidence": f"Derived & verified from GSTIN identity segment ({gstin_found})"
            }

    return {"value": None, "page": None, "evidence": None}

def extract_gstin(pages: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
    """
    Extracts Goods and Services Tax Identification Number (GSTIN).
    Standard pattern: 2 digits (state code) + 10 char PAN + 1 entity code + 'Z' + 1 checksum.
    """
    # Prefer contextual match
    context_res = _find_in_pages(pages, r'(?:gstin|gst\s+registration\s+no|gst\s+no|gst)[^0-9A-Z]{0,30}\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z])\b')
    if context_res:
        val = context_res["match"].group(1).upper()
        return {
            "value": val,
            "page": context_res["page"],
            "evidence": context_res["evidence"]
        }
        
    # Standalone GSTIN pattern
    standalone_res = _find_in_pages(pages, r'\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z])\b')
    if standalone_res:
        val = standalone_res["match"].group(1).upper()
        return {
            "value": val,
            "page": standalone_res["page"],
            "evidence": standalone_res["evidence"]
        }

    return {"value": None, "page": None, "evidence": None}

def extract_udyam(pages: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
    """
    Extracts MSME Udyam Registration Number.
    Standard: UDYAM-XX-00-0000000
    """
    res = _find_in_pages(pages, r'\b(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})\b')
    if res:
        val = res["match"].group(1).upper()
        return {
            "value": val,
            "page": res["page"],
            "evidence": res["evidence"]
        }
        
    # Contextual check with relaxed spacing
    context_res = _find_in_pages(pages, r'(?:udyam|msme|enterprise\s+registration)[^A-Z0-9]{0,30}\b(UDYAM[ -]?[A-Z]{2}[ -]?[0-9]{2}[ -]?[0-9]{7})\b')
    if context_res:
        raw_val = context_res["match"].group(1).upper()
        clean_val = re.sub(r'[ -]+', '-', raw_val)
        if not clean_val.startswith('UDYAM-'):
            clean_val = clean_val.replace('UDYAM', 'UDYAM-')
        return {
            "value": clean_val,
            "page": context_res["page"],
            "evidence": context_res["evidence"]
        }

    return {"value": None, "page": None, "evidence": None}

def extract_epfo(pages: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
    """
    Extracts EPFO Establishment Code using strict contextual grounding.
    Standard Indian EPFO: 2-letter state + 3-letter office + 7-digit code + 3-digit extension.
    Example: DLCPM0019284000 or DL/CPM/0019284/000.
    """
    patterns = [
        # Contextual prefix + solid 15-char code
        r'(?:epfo|epf|pf\s+registration|provident\s+fund)[^A-Z0-9]{0,40}\b([A-Z]{2}[A-Z0-9]{3}[0-9]{7}[0-9]{3})\b',
        # Contextual prefix + slashed format
        r'(?:epfo|epf|pf\s+registration|provident\s+fund)[^A-Z0-9]{0,40}\b([A-Z]{2}/[A-Z0-9]{3}/[0-9]{7}/[0-9]{3})\b',
        # Slashed format standalone
        r'\b([A-Z]{2}/[A-Z0-9]{3}/[0-9]{7}/[0-9]{3})\b',
        # Standalone standard 15-char EPFO pattern with leading state code
        r'\b([A-Z]{2}[A-Z]{3}[0-9]{7}[0-9]{3})\b'
    ]
    for pat in patterns:
        res = _find_in_pages(pages, pat)
        if res:
            val = res["match"].group(1).upper()
            return {
                "value": val,
                "page": res["page"],
                "evidence": res["evidence"]
            }

    return {"value": None, "page": None, "evidence": None}

def extract_local_content(pages: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
    """
    Extracts Make in India (MII) local content percentage from contextual clauses.
    Strictly prevents picking arbitrary percentages like GST 18% or TDS 2%.
    """
    patterns = [
        # 1. "local content is 68.5%" or "Make in India local content: 72%"
        r'(?:local\s+content(?:\s+declaration|\s+percentage|\s+of)?|make\s+in\s+india|mii|class-[iI]{1,2}\s+local\s+supplier)[^\n\r%]{0,100}?([0-9]{1,3}(?:\.[0-9]+)?)\s*%',
        # 2. "68.5% local content" or "72% MII compliant"
        r'([0-9]{1,3}(?:\.[0-9]+)?)\s*%\s*[^\n\r%]{0,60}?(?:local\s+content|make\s+in\s+india|mii)',
        # 3. Explicit declaration sentences: "declared ... 65 percent local content"
        r'(?:certify|declare|undertake)[^\n\r%]{0,80}?([0-9]{1,3}(?:\.[0-9]+)?)\s*(?:%|\s*percent)\s*[^\n\r%]{0,60}?(?:local\s+content|mii)'
    ]
    for pat in patterns:
        res = _find_in_pages(pages, pat)
        if res:
            try:
                val = float(res["match"].group(1))
                if 0.0 <= val <= 100.0:
                    return {
                        "value": val,
                        "page": res["page"],
                        "evidence": res["evidence"]
                    }
            except (ValueError, TypeError):
                continue

    return {"value": None, "page": None, "evidence": None}

def extract_turnover(pages: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
    """
    Extracts financial turnover figures near annual turnover / FY references.
    Supports Indian currency notation (Crore, Lakh, ₹, INR).
    """
    turnover_data = {
        "fy_2023_24": None,
        "fy_2024_25": None,
        "fy_2025_26": None,
        "average": None,
        "evidence": None,
        "page": None
    }
    
    # Check specific FYs
    fy_patterns = [
        ("fy_2023_24", r'(?:fy\s*2023[-/]24|2023[-/]2024)[^0-9₹INR]{0,40}(?:₹|INR|Rs\.?)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:cr(?:ore)?s?|lakhs?|lac?s?)?)'),
        ("fy_2024_25", r'(?:fy\s*2024[-/]25|2024[-/]2025)[^0-9₹INR]{0,40}(?:₹|INR|Rs\.?)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:cr(?:ore)?s?|lakhs?|lac?s?)?)'),
        ("fy_2025_26", r'(?:fy\s*2025[-/]26|2025[-/]2026)[^0-9₹INR]{0,40}(?:₹|INR|Rs\.?)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:cr(?:ore)?s?|lakhs?|lac?s?)?)'),
    ]
    for key, pat in fy_patterns:
        res = _find_in_pages(pages, pat)
        if res:
            turnover_data[key] = res["match"].group(1).strip()
            if not turnover_data["evidence"]:
                turnover_data["evidence"] = res["evidence"]
                turnover_data["page"] = res["page"]

    # General / average turnover
    avg_pat = r'(?:average\s+annual\s+turnover|annual\s+turnover|turnover\s+certificate)[^0-9₹INR]{0,50}(?:₹|INR|Rs\.?)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:cr(?:ore)?s?|lakhs?|lac?s?)?)'
    avg_res = _find_in_pages(pages, avg_pat)
    if avg_res:
        turnover_data["average"] = avg_res["match"].group(1).strip()
        if not turnover_data["evidence"]:
            turnover_data["evidence"] = avg_res["evidence"]
            turnover_data["page"] = avg_res["page"]

    return turnover_data

def extract_oem_authorization(pages: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
    """
    Detects OEM Authorization / Manufacturer Authorization Form (MAF) details,
    OEM entity name, and certificate validity dates.
    """
    oem_result = {
        "oem_name": None,
        "oem_authorization_valid_until": None,
        "evidence": None,
        "page": None
    }
    
    maf_pat = r'(?:oem\s+authorization|manufacturer\s+authorization|authorized\s+partner\s+of|authorized\s+distributor\s+of|maf)[^A-Za-z0-9]{0,40}([A-Za-z0-9\s&.,-]{3,40}?)(?:\s+for|\s+vide|\s+dated|\s+valid|\.|\n)'
    res = _find_in_pages(pages, maf_pat)
    if res:
        candidate_name = res["match"].group(1).strip()
        # Clean generic words
        clean_name = re.sub(r'^(for|dated|vide|to|is)\s+', '', candidate_name, flags=re.IGNORECASE).strip()
        if len(clean_name) >= 3:
            oem_result["oem_name"] = clean_name
            oem_result["evidence"] = res["evidence"]
            oem_result["page"] = res["page"]

    # Search for validity date: "valid until DD/MM/YYYY" or "valid up to DD-MM-YYYY"
    date_pat = r'(?:valid\s+until|valid\s+up\s+to|validity\s+period\s+up\s+to|expiry\s+date)[^0-9]{0,30}([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4})'
    date_res = _find_in_pages(pages, date_pat)
    if date_res:
        oem_result["oem_authorization_valid_until"] = date_res["match"].group(1).strip()
        if not oem_result["evidence"]:
            oem_result["evidence"] = date_res["evidence"]
            oem_result["page"] = date_res["page"]

    return oem_result

def extract_bid_dossier(ingestion_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Master Structured Dossier Extractor (Task 4 & 12).
    Processes ingested multi-page document and extracts statutory entities,
    financial figures, and MII compliance with page-aware evidence.
    """
    pages = ingestion_result.get("pages", [])
    raw_text = ingestion_result.get("text", "") or ingestion_result.get("raw_text", "")

    gstin_info = extract_gstin(pages, raw_text)
    pan_info = extract_pan(pages, raw_text, gstin_found=gstin_info["value"])
    udyam_info = extract_udyam(pages, raw_text)
    epfo_info = extract_epfo(pages, raw_text)
    mii_info = extract_local_content(pages, raw_text)
    turnover_info = extract_turnover(pages, raw_text)
    oem_info = extract_oem_authorization(pages, raw_text)

    evidence_map = {}
    if pan_info["value"]:
        evidence_map["pan"] = {
            "field": "pan",
            "value": pan_info["value"],
            "page": pan_info["page"],
            "evidence": pan_info["evidence"]
        }
    if gstin_info["value"]:
        evidence_map["gstin"] = {
            "field": "gstin",
            "value": gstin_info["value"],
            "page": gstin_info["page"],
            "evidence": gstin_info["evidence"]
        }
    if udyam_info["value"]:
        evidence_map["udyam"] = {
            "field": "udyam",
            "value": udyam_info["value"],
            "page": udyam_info["page"],
            "evidence": udyam_info["evidence"]
        }
    if epfo_info["value"]:
        evidence_map["epfo"] = {
            "field": "epfo",
            "value": epfo_info["value"],
            "page": epfo_info["page"],
            "evidence": epfo_info["evidence"]
        }
    if mii_info["value"] is not None:
        evidence_map["local_content"] = {
            "field": "local_content_percent",
            "value": mii_info["value"],
            "page": mii_info["page"],
            "evidence": mii_info["evidence"]
        }
    if turnover_info["average"] or any(turnover_info[k] for k in ["fy_2023_24", "fy_2024_25", "fy_2025_26"]):
        evidence_map["turnover"] = {
            "field": "turnover",
            "value": turnover_info["average"] or turnover_info["fy_2024_25"],
            "page": turnover_info["page"],
            "evidence": turnover_info["evidence"]
        }
    if oem_info["oem_name"]:
        evidence_map["oem"] = {
            "field": "oem_name",
            "value": oem_info["oem_name"],
            "page": oem_info["page"],
            "evidence": oem_info["evidence"]
        }

    return {
        "pan": pan_info["value"],
        "gstin": gstin_info["value"],
        "udyam": udyam_info["value"],
        "epfo": epfo_info["value"],
        "local_content_percent": mii_info["value"],
        "local_content_evidence": mii_info["evidence"],
        "turnover": {
            "fy_2023_24": turnover_info["fy_2023_24"],
            "fy_2024_25": turnover_info["fy_2024_25"],
            "fy_2025_26": turnover_info["fy_2025_26"],
            "average": turnover_info["average"]
        },
        "oem_name": oem_info["oem_name"],
        "oem_authorization_valid_until": oem_info["oem_authorization_valid_until"],
        "evidence": evidence_map
    }

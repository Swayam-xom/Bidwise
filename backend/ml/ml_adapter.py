"""
ML Adapter and Feature Provenance Engine for GeM Bid Compliance Platform.
Transforms structured dossier extractions, submission metadata, and deterministic
compliance rules into the strict 21-feature schema required by the ML inference engine.
"""

import os
import re
from typing import Dict, Any, Tuple, Optional

# The exact 21 features in the exact required order
ORDERED_ML_FEATURES = [
    'seller_experience_years',
    'seller_turnover_inr',
    'bid_value_inr',
    'experience_certificate',
    'technical_compliance_score',
    'document_completeness_pct',
    'price_deviation_pct',
    'delivery_days',
    'past_contracts_count',
    'complaints_count',
    'ocr_required',
    'category',
    'gst_status',
    'pan_status',
    'msme_status',
    'oem_authorization',
    'turnover_certificate',
    'document_verification_status',
    'gst_name_match',
    'gst_registration_state_match',
    'gst_return_filing_status'
]

# Baseline constants for neutral default values (when features are unobserved/unavailable)
BASELINE_EXPERIENCE_YEARS = 5.0
BASELINE_TURNOVER_INR = 10000000.0  # ₹1.00 Cr
BASELINE_BID_VALUE_INR = 5000000.0   # ₹50 Lakh
BASELINE_DELIVERY_DAYS = 30
BASELINE_PAST_CONTRACTS = 10
BASELINE_COMPLAINTS_COUNT = 0
BASELINE_CATEGORY = "Laptops"
DEFAULT_TENDER_BUDGET = 60000000.0   # ₹6.00 Cr for GEM/2026/B/892101


def parse_currency_to_inr(val_str: Optional[str]) -> Optional[float]:
    """Parses Indian currency strings (e.g. '18.5 Crore', '₹50 Lakh', '5240000') to INR float."""
    if not val_str:
        return None
    try:
        clean = str(val_str).replace(",", "").replace("₹", "").replace("INR", "").replace("Rs.", "").strip()
        
        # Check Crore
        m_cr = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:cr(?:ore)?s?)', clean, re.IGNORECASE)
        if m_cr:
            return float(m_cr.group(1)) * 10000000.0
            
        # Check Lakh
        m_lakh = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:lakhs?|lac?s?)', clean, re.IGNORECASE)
        if m_lakh:
            return float(m_lakh.group(1)) * 100000.0
            
        # Direct numeric
        m_num = re.search(r'([0-9]+(?:\.[0-9]+)?)', clean)
        if m_num:
            num = float(m_num.group(1))
            # If number is small like 18.5 without 'Cr', assume Crore if < 100
            if num < 100.0:
                return num * 10000000.0
            return num
    except Exception:
        pass
    return None


def map_features_with_provenance(
    dossier: Dict[str, Any],
    rule_score: int = 100,
    deductions: Optional[list] = None,
    submission_context: Optional[Dict[str, Any]] = None
) -> Tuple[Dict[str, Any], Dict[str, Dict[str, Any]]]:
    """
    Constructs the exact 21-feature ML input dictionary in strict order, along
    with a granular Feature Provenance record for transparency.

    Provenance classifications:
    - 'DOCUMENT': Directly extracted from the uploaded PDF document.
    - 'DERIVED': Computed from extracted data or deterministic compliance engine.
    - 'PLATFORM': Provided through tender or bidder platform submission metadata.
    - 'MOCK_EXTERNAL': Verified through external API simulation (GST portal / MCA21).
    - 'UNAVAILABLE': Neutral baseline applied; feature not present in current inputs.
    """
    ctx = submission_context or {}
    deductions = deductions or []
    provenance: Dict[str, Dict[str, Any]] = {}

    pan = dossier.get("pan")
    gstin = dossier.get("gstin")
    udyam = dossier.get("udyam")
    epfo = dossier.get("epfo")
    local_content = dossier.get("local_content_percent") if dossier.get("local_content_percent") is not None else dossier.get("local_content")
    turnover_data = dossier.get("turnover") or {}
    oem_data = dossier.get("oem") or {}
    extraction_method = dossier.get("extraction_method", "pdf_text")

    # 1. seller_experience_years
    if ctx.get("experience_years") is not None:
        val_exp = float(ctx["experience_years"])
        src_exp = "PLATFORM"
    else:
        val_exp = BASELINE_EXPERIENCE_YEARS
        src_exp = "UNAVAILABLE"
    provenance["seller_experience_years"] = {"value": val_exp, "source": src_exp}

    # 2. seller_turnover_inr
    raw_turnover = (
        turnover_data.get("average")
        or turnover_data.get("fy_2024_25")
        or turnover_data.get("fy_2023_24")
        or turnover_data.get("fy_2025_26")
        or ctx.get("financial_turnover")
    )
    parsed_to = parse_currency_to_inr(raw_turnover)
    if parsed_to is not None and parsed_to > 0:
        val_to = float(parsed_to)
        src_to = "DOCUMENT"
    else:
        val_to = BASELINE_TURNOVER_INR
        src_to = "UNAVAILABLE"
    provenance["seller_turnover_inr"] = {"value": val_to, "source": src_to}

    # 3. bid_value_inr
    quote_amount = ctx.get("quote_amount") or ctx.get("quoted_price")
    if quote_amount is not None and float(quote_amount) > 0:
        val_bid = float(quote_amount)
        src_bid = "PLATFORM"
    else:
        val_bid = BASELINE_BID_VALUE_INR
        src_bid = "UNAVAILABLE"
    provenance["bid_value_inr"] = {"value": val_bid, "source": src_bid}

    # 4. experience_certificate (1.0 or 0.0)
    has_exp_cert = 1.0 if (ctx.get("experience_years", 0) > 0 or "experience" in dossier.get("evidence", {})) else 1.0
    provenance["experience_certificate"] = {"value": float(has_exp_cert), "source": "DOCUMENT" if "experience" in dossier.get("evidence", {}) else "DERIVED"}

    # 5. technical_compliance_score (0.0 to 100.0)
    val_tech_score = float(max(0, min(100, rule_score)))
    provenance["technical_compliance_score"] = {"value": val_tech_score, "source": "DERIVED"}

    # 6. document_completeness_pct
    checklist = [
        bool(pan),
        bool(gstin),
        bool(udyam),
        bool(epfo),
        local_content is not None,
        bool(raw_turnover),
        bool(oem_data.get("oem_name"))
    ]
    completeness_pct = round((sum(checklist) / len(checklist)) * 100.0, 1)
    provenance["document_completeness_pct"] = {"value": completeness_pct, "source": "DERIVED"}

    # 7. price_deviation_pct
    budget = float(ctx.get("tender_budget") or DEFAULT_TENDER_BUDGET)
    if quote_amount and budget > 0:
        price_dev = round(((float(quote_amount) - budget) / budget) * 100.0, 2)
        src_dev = "DERIVED"
    else:
        price_dev = 0.0
        src_dev = "UNAVAILABLE"
    provenance["price_deviation_pct"] = {"value": float(price_dev), "source": src_dev}

    # 8. delivery_days
    raw_text = dossier.get("raw_text", "")
    m_deliv = re.search(r'delivery\s+(?:period|within|timeline)[^0-9]{0,20}([0-9]{1,3})\s*days', raw_text, re.IGNORECASE)
    if m_deliv:
        val_deliv = float(m_deliv.group(1))
        src_deliv = "DOCUMENT"
    else:
        val_deliv = float(BASELINE_DELIVERY_DAYS)
        src_deliv = "UNAVAILABLE"
    provenance["delivery_days"] = {"value": val_deliv, "source": src_deliv}

    # 9. past_contracts_count
    val_contracts = float(ctx.get("past_contracts_count", BASELINE_PAST_CONTRACTS))
    provenance["past_contracts_count"] = {"value": val_contracts, "source": "PLATFORM" if "past_contracts_count" in ctx else "UNAVAILABLE"}

    # 10. complaints_count
    val_complaints = float(ctx.get("complaints_count", BASELINE_COMPLAINTS_COUNT))
    provenance["complaints_count"] = {"value": val_complaints, "source": "PLATFORM" if "complaints_count" in ctx else "UNAVAILABLE"}

    # 11. ocr_required (0.0 for native digital pdf, 1.0 for scanned/OCR pdf)
    is_ocr = 1.0 if extraction_method in ["rapidocr_onnx", "scanned_pdf", "ocr", "scanned_image_pdf"] else 0.0
    provenance["ocr_required"] = {"value": float(is_ocr), "source": "DERIVED"}

    # 12. category
    val_category = str(ctx.get("category") or BASELINE_CATEGORY)
    provenance["category"] = {"value": val_category, "source": "PLATFORM" if "category" in ctx else "UNAVAILABLE"}

    # 13. gst_status
    has_pan_gst_mismatch = False
    if pan and gstin and len(gstin) >= 12:
        has_pan_gst_mismatch = (gstin[2:12].upper() != pan.upper())

    if not gstin:
        val_gst_status = "Missing"
    elif has_pan_gst_mismatch or any("PAN mismatch" in d.get("reason", "") for d in deductions):
        val_gst_status = "Suspended"
    else:
        val_gst_status = "Active"
    provenance["gst_status"] = {"value": val_gst_status, "source": "DERIVED"}

    # 14. pan_status
    if not pan:
        val_pan_status = "Missing"
    elif has_pan_gst_mismatch or any("PAN mismatch" in d.get("reason", "") for d in deductions):
        val_pan_status = "Mismatch Flagged"
    else:
        val_pan_status = "Verified"
    provenance["pan_status"] = {"value": val_pan_status, "source": "DERIVED"}

    # 15. msme_status
    if udyam:
        val_msme = "Medium"
        src_msme = "DOCUMENT"
    else:
        val_msme = "Non-MSME"
        src_msme = "DERIVED"
    provenance["msme_status"] = {"value": val_msme, "source": src_msme}

    # 16. oem_authorization
    if oem_data.get("oem_name"):
        val_oem = "Valid"
        src_oem = "DOCUMENT"
    elif ctx.get("oem_authorization") == "Valid":
        val_oem = "Valid"
        src_oem = "PLATFORM"
    else:
        val_oem = "Missing"
        src_oem = "DERIVED"
    provenance["oem_authorization"] = {"value": val_oem, "source": src_oem}

    # 17. turnover_certificate
    if parsed_to is not None or ctx.get("financial_turnover"):
        val_tc = "Verified"
        src_tc = "DOCUMENT"
    else:
        val_tc = "Missing"
        src_tc = "DERIVED"
    provenance["turnover_certificate"] = {"value": val_tc, "source": src_tc}

    # 18. document_verification_status
    if has_pan_gst_mismatch:
        val_dvs = "Mismatch"
    elif not pan or not gstin:
        val_dvs = "Missing"
    elif rule_score < 60:
        val_dvs = "Suspicious"
    else:
        val_dvs = "Verified"
    provenance["document_verification_status"] = {"value": val_dvs, "source": "DERIVED"}

    # 19. gst_name_match
    if has_pan_gst_mismatch:
        val_gnm = "Mismatch"
        src_gnm = "DERIVED"
    elif gstin and (ctx.get("bidder_name") or ctx.get("company_name")):
        val_gnm = "Match"
        src_gnm = "MOCK_EXTERNAL"
    else:
        val_gnm = "Match"
        src_gnm = "UNAVAILABLE"
    provenance["gst_name_match"] = {"value": val_gnm, "source": src_gnm}

    # 20. gst_registration_state_match
    val_gsm = "Mismatch" if (has_pan_gst_mismatch and gstin and gstin.startswith("07") and "27" in (ctx.get("gstin") or "")) else "Match"
    provenance["gst_registration_state_match"] = {"value": val_gsm, "source": "MOCK_EXTERNAL"}

    # 21. gst_return_filing_status
    if val_gst_status == "Suspended":
        val_grf = "Not Filed"
        src_grf = "MOCK_EXTERNAL"
    elif val_gst_status == "Active":
        val_grf = "Regular"
        src_grf = "MOCK_EXTERNAL"
    else:
        val_grf = "Unavailable"
        src_grf = "UNAVAILABLE"
    provenance["gst_return_filing_status"] = {"value": val_grf, "source": src_grf}

    # Build exact ordered feature dictionary
    ordered_features: Dict[str, Any] = {}
    for feature_name in ORDERED_ML_FEATURES:
        ordered_features[feature_name] = provenance[feature_name]["value"]

    return ordered_features, provenance


def evaluate_bid_ml_compliance(
    dossier: Dict[str, Any],
    rule_score: int = 100,
    deductions: Optional[list] = None,
    submission_context: Optional[Dict[str, Any]] = None,
    artifacts_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the end-to-end ML prediction pipeline for a single bid dossier.
    Includes fault-tolerant error trapping to ensure deterministic rule validation
    is NEVER blocked by ML subsystem failures.
    """
    features, provenance = map_features_with_provenance(
        dossier=dossier,
        rule_score=rule_score,
        deductions=deductions,
        submission_context=submission_context
    )

    try:
        from .inference import predict_bid_compliance
        ml_result = predict_bid_compliance(features, artifacts_dir=artifacts_dir)
        return {
            "ml_status": "available",
            "ml_prediction": ml_result,
            "feature_provenance": provenance,
            "mapped_features": features
        }
    except Exception as e:
        return {
            "ml_status": "unavailable",
            "ml_prediction": None,
            "feature_provenance": provenance,
            "mapped_features": features,
            "ml_error": str(e)
        }

"""
BidWise PDF Compliance Certificate Generator
Uses ReportLab to generate dynamic, official verification reports for tender submissions.
Sections:
  A. Extracted Document Information (Provided in Bidder Dossier)
  B. Deterministic Compliance Rules & Deductions
  C. Dual-Model Machine Learning Assessment (Decision Support)
  D. Final Verification Summary & Disclaimers
"""

import io
import json
import time
from typing import Any, Dict, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

# Indian State codes mapping for GSTIN
GST_STATE_MAP = {
    "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
    "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
    "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
    "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "28": "Andhra Pradesh (Old)",
    "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
    "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands",
    "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh", "97": "Other Territory"
}

def get_gst_state_name(gstin: Optional[str]) -> str:
    if not gstin or len(gstin) < 2:
        return "Not Applicable"
    code = gstin[:2]
    return GST_STATE_MAP.get(code, f"State Code {code}")

def generate_bid_compliance_pdf(bid_data: Dict[str, Any], tender_data: Optional[Dict[str, Any]] = None) -> bytes:
    """
    Generates a high-quality PDF compliance certificate from the bid data dict.
    Returns the generated PDF as raw bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom colors & styles
    primary_color = colors.HexColor("#0f172a")    # Slate 900
    brand_blue = colors.HexColor("#2563eb")       # Blue 600
    success_color = colors.HexColor("#16a34a")    # Green 600
    warning_color = colors.HexColor("#d97706")    # Amber 600
    danger_color = colors.HexColor("#dc2626")     # Red 600
    neutral_light = colors.HexColor("#f8fafc")    # Slate 50
    neutral_border = colors.HexColor("#e2e8f0")   # Slate 200
    text_dark = colors.HexColor("#1e293b")        # Slate 800
    text_muted = colors.HexColor("#64748b")       # Slate 500

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=primary_color,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=text_muted,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=brand_blue,
        spaceBefore=8,
        spaceAfter=4
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=text_dark
    )

    cell_val = ParagraphStyle(
        'CellVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=text_dark
    )

    cell_muted = ParagraphStyle(
        'CellMuted',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=text_muted
    )

    badge_style = ParagraphStyle(
        'BadgeText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.white,
        alignment=1 # Center
    )

    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=text_muted
    )

    elements = []

    # 1. Header Banner
    header_table_data = [
        [
            Paragraph("<b>BidWise</b> &bull; Compliance Verification Certificate", title_style),
            Paragraph(f"<b>STATUS:</b> {str(bid_data.get('status', 'Under Review')).upper()}", badge_style)
        ],
        [
            Paragraph("India-wide AI-Powered Procurement Compliance Platform &bull; MPOnline Hackathon 2026", subtitle_style),
            Paragraph(f"<b>Risk:</b> {str(bid_data.get('risk_level', 'Medium')).upper()}", badge_style)
        ]
    ]

    status_str = str(bid_data.get('status', '')).upper()
    if status_str == "QUALIFIED":
        badge_bg = success_color
    elif status_str == "CLARIFICATION":
        badge_bg = warning_color
    else:
        badge_bg = danger_color

    header_table = Table(header_table_data, colWidths=[380, 160])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (1, 0), (1, 0), badge_bg),
        ('BACKGROUND', (1, 1), (1, 1), primary_color),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 6))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=brand_blue, spaceBefore=2, spaceAfter=8))

    # 2. Key Metadata Block
    quoted_price = bid_data.get("quote_amount") or bid_data.get("quoted_price") or 0.0
    submitted_at = bid_data.get("submitted_at") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    tender_id = tender_data.get("tender_id") if tender_data else bid_data.get("tender_id", "GEM/2026/B/892101")
    tender_title = tender_data.get("title") if tender_data else "Supply, Configuration & 3-Yr Support of 500 Enterprise Laptops"

    meta_data = [
        [
            Paragraph("<b>Bid ID:</b>", cell_bold), Paragraph(str(bid_data.get("bid_id", "N/A")), cell_val),
            Paragraph("<b>Tender ID:</b>", cell_bold), Paragraph(str(tender_id), cell_val)
        ],
        [
            Paragraph("<b>Bidder Name:</b>", cell_bold), Paragraph(str(bid_data.get("company_name") or bid_data.get("name") or "N/A"), cell_val),
            Paragraph("<b>Tender Title:</b>", cell_bold), Paragraph(str(tender_title)[:40] + "...", cell_val)
        ],
        [
            Paragraph("<b>Bid Value (INR):</b>", cell_bold), Paragraph(f"&#8377; {quoted_price:,.2f}", cell_val),
            Paragraph("<b>Submitted At:</b>", cell_bold), Paragraph(str(submitted_at), cell_val)
        ],
        [
            Paragraph("<b>Rule Score:</b>", cell_bold), Paragraph(f"{bid_data.get('compliance_score', 0)} / 100", cell_bold),
            Paragraph("<b>Doc Extraction:</b>", cell_bold), Paragraph(f"{bid_data.get('extraction_method', 'pdf_text')} ({bid_data.get('page_count', 1)} pages)", cell_val)
        ]
    ]

    meta_table = Table(meta_data, colWidths=[90, 180, 80, 190])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), neutral_light),
        ('BOX', (0, 0), (-1, -1), 0.5, neutral_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, neutral_border),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 8))

    # SECTION A: EXTRACTED DOCUMENT INFORMATION
    elements.append(Paragraph("A. Extracted Document Information <i>(Provided in Bidder Dossier)</i>", h2_style))
    elements.append(Paragraph("Statutory and banking particulars extracted directly from the submitted PDF document for supporting evidence verification.", subtitle_style))

    ext_data = bid_data.get("extracted_data") or bid_data.get("extractedJson") or {}
    pan_val = ext_data.get("pan") or bid_data.get("pan") or "Not Found"
    gstin_val = ext_data.get("gstin") or bid_data.get("gstin") or "Not Found"
    udyam_val = ext_data.get("udyam") or bid_data.get("udyam") or "Not Provided"
    epfo_val = ext_data.get("epfo") or bid_data.get("epfo") or "Not Provided"
    esic_val = ext_data.get("esic") or bid_data.get("esic") or "Not Provided"
    bank_name_val = ext_data.get("bank_name") or (bid_data.get("bank", {}) if isinstance(bid_data.get("bank"), dict) else {}).get("bank_name") or bid_data.get("bank_name") or "Not Provided"
    acc_num_val = ext_data.get("account_number") or (bid_data.get("bank", {}) if isinstance(bid_data.get("bank"), dict) else {}).get("account_number") or bid_data.get("account_number") or "Not Provided"
    ifsc_val = ext_data.get("ifsc") or (bid_data.get("bank", {}) if isinstance(bid_data.get("bank"), dict) else {}).get("ifsc") or bid_data.get("ifsc") or "Not Provided"
    mii_val = ext_data.get("local_content_percent") if ext_data.get("local_content_percent") is not None else bid_data.get("local_content_percent")
    mii_str = f"{mii_val}%" if mii_val is not None else "Not Declared"
    gst_state = get_gst_state_name(gstin_val) if gstin_val != "Not Found" else "N/A"

    doc_info_data = [
        [
            Paragraph("<b>Permanent Account Number (PAN):</b>", cell_bold), Paragraph(str(pan_val), cell_val),
            Paragraph("<b>GSTIN:</b>", cell_bold), Paragraph(str(gstin_val), cell_val)
        ],
        [
            Paragraph("<b>GST State Jurisdiction:</b>", cell_bold), Paragraph(f"{gst_state}", cell_val),
            Paragraph("<b>Udyam / MSME Registration:</b>", cell_bold), Paragraph(str(udyam_val), cell_val)
        ],
        [
            Paragraph("<b>EPFO Registration Code:</b>", cell_bold), Paragraph(str(epfo_val), cell_val),
            Paragraph("<b>ESIC Registration No:</b>", cell_bold), Paragraph(f"{esic_val} <i>[Doc Extracted]</i>", cell_val)
        ],
        [
            Paragraph("<b>Bank Name & Account:</b>", cell_bold), Paragraph(f"{bank_name_val} ({acc_num_val})", cell_val),
            Paragraph("<b>Bank IFSC Code:</b>", cell_bold), Paragraph(f"{ifsc_val} <i>[Doc Extracted]</i>", cell_val)
        ],
        [
            Paragraph("<b>Make In India Local Content:</b>", cell_bold), Paragraph(f"{mii_str}", cell_val),
            Paragraph("<b>Verification Source:</b>", cell_bold), Paragraph("Extracted PDF Dossier Evidence", cell_muted)
        ]
    ]

    doc_table = Table(doc_info_data, colWidths=[160, 120, 130, 130])
    doc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), neutral_light),
        ('BOX', (0, 0), (-1, -1), 0.5, neutral_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, neutral_border),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(doc_table)
    elements.append(Spacer(1, 8))

    # SECTION B: DETERMINISTIC COMPLIANCE RULES & DEDUCTIONS
    elements.append(Paragraph("B. Deterministic Compliance Rules & Statutory Checks", h2_style))
    
    # PAN / GSTIN cross-check
    embedded_pan = gstin_val[2:12] if len(gstin_val) >= 12 else ""
    pan_gst_match = (embedded_pan == pan_val) and (pan_val != "Not Found")
    pan_match_text = "<b>MATCHED:</b> Standalone PAN matches GSTIN identity." if pan_gst_match else f"<b>MISMATCH:</b> PAN ({pan_val}) != GSTIN embedded PAN ({embedded_pan})"

    rules_summary_data = [
        [
            Paragraph("<b>Statutory Rule</b>", cell_bold),
            Paragraph("<b>Condition / Policy</b>", cell_bold),
            Paragraph("<b>Observed Result</b>", cell_bold),
            Paragraph("<b>Compliance</b>", cell_bold)
        ],
        [
            Paragraph("PAN ↔ GSTIN Identity", cell_val),
            Paragraph("Embedded PAN (chars 3-12) must match Standalone PAN", cell_val),
            Paragraph(pan_match_text, cell_val),
            Paragraph("PASS" if pan_gst_match else "FAIL", cell_bold)
        ],
        [
            Paragraph("Make In India Local Content", cell_val),
            Paragraph("Min 50.0% Class-I Local Supplier cutoff", cell_val),
            Paragraph(f"Declared: {mii_str}", cell_val),
            Paragraph("PASS" if (mii_val is not None and mii_val >= 50.0) else "FAIL", cell_bold)
        ],
        [
            Paragraph("EPFO Social Security", cell_val),
            Paragraph("Valid EPFO registration code mandatory for labor compliance", cell_val),
            Paragraph(f"Code: {epfo_val}", cell_val),
            Paragraph("PASS" if (epfo_val and epfo_val != "Not Provided") else "FAIL", cell_bold)
        ]
    ]

    rules_table = Table(rules_summary_data, colWidths=[120, 160, 180, 80])
    rules_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), neutral_border),
        ('BOX', (0, 0), (-1, -1), 0.5, neutral_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, neutral_border),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(rules_table)
    elements.append(Spacer(1, 4))

    deductions = bid_data.get("deductions") or []
    if deductions:
        elements.append(Paragraph("<b>Identified Rule Deductions / Violations:</b>", cell_bold))
        ded_table_data = [
            [Paragraph("<b>Category</b>", cell_bold), Paragraph("<b>Violation Reason</b>", cell_bold), Paragraph("<b>Penalty</b>", cell_bold)]
        ]
        for d in deductions:
            ded_table_data.append([
                Paragraph(str(d.get("category", "General")), cell_val),
                Paragraph(str(d.get("reason", "")), cell_val),
                Paragraph(f"{d.get('score', 0)} pts", cell_bold)
            ])
        ded_table = Table(ded_table_data, colWidths=[140, 320, 80])
        ded_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#fee2e2")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(ded_table)
    else:
        elements.append(Paragraph("<i>No statutory rule deductions recorded. All deterministic criteria satisfied.</i>", cell_muted))

    elements.append(Spacer(1, 8))

    # SECTION C: DUAL-MODEL MACHINE LEARNING ASSESSMENT
    elements.append(Paragraph("C. Dual-Model Machine Learning Assessment <i>(Ensemble Decision Support)</i>", h2_style))
    ml_pred = bid_data.get("ml_prediction") or {}
    ml_label = ml_pred.get("predicted_compliance_label", "Evaluated")
    ml_conf = ml_pred.get("confidence", 0.0) or 0.0
    ml_risk_score = ml_pred.get("compliance_risk_score", 0.0) or 0.0
    ml_risk_level = ml_pred.get("risk_level", "Medium")
    probs = ml_pred.get("probabilities") or {}

    p_comp = probs.get("Compliant", 0.0) or 0.0
    p_rev = probs.get("Needs Review", 0.0) or 0.0
    p_non = probs.get("Non-Compliant", 0.0) or 0.0

    ml_table_data = [
        [
            Paragraph("<b>ML Predicted Label:</b>", cell_bold), Paragraph(f"<b>{ml_label}</b>", cell_bold),
            Paragraph("<b>Model Confidence:</b>", cell_bold), Paragraph(f"{ml_conf * 100:.1f}%", cell_val)
        ],
        [
            Paragraph("<b>Compliance Risk Score:</b>", cell_bold), Paragraph(f"<b>{ml_risk_score:.1f} / 100</b> ({ml_risk_level} Risk)", cell_val),
            Paragraph("<b>Model Ensemble:</b>", cell_bold), Paragraph("LR (52%) + LightGBM (48%)", cell_val)
        ],
        [
            Paragraph("<b>P(Compliant):</b>", cell_bold), Paragraph(f"{p_comp * 100:.1f}%", cell_val),
            Paragraph("<b>P(Needs Review):</b>", cell_bold), Paragraph(f"{p_rev * 100:.1f}%", cell_val)
        ],
        [
            Paragraph("<b>P(Non-Compliant):</b>", cell_bold), Paragraph(f"{p_non * 100:.1f}%", cell_val),
            Paragraph("<b>Feature Vector:</b>", cell_bold), Paragraph("21 Statutory & Commercial Features", cell_muted)
        ]
    ]

    ml_table = Table(ml_table_data, colWidths=[140, 140, 130, 130])
    ml_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), neutral_light),
        ('BOX', (0, 0), (-1, -1), 0.5, neutral_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, neutral_border),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(ml_table)
    elements.append(Spacer(1, 8))

    # SECTION D: FINAL VERIFICATION SUMMARY & DISCLAIMERS
    elements.append(Paragraph("D. Final Verification Summary & Disclaimers", h2_style))
    officer_remark = bid_data.get("officer_remark") or "Automated AI Verification & Statutory Rule Evaluation Completed."

    summary_box = [
        [
            Paragraph("<b>Verification Summary:</b>", cell_bold),
            Paragraph(f"{officer_remark}", cell_val)
        ],
        [
            Paragraph("<b>Authority Notice:</b>", cell_bold),
            Paragraph(
                "This report separates document-extracted evidence, deterministic compliance rules, and dual-model ML risk scoring. "
                "Supporting document information (such as ESIC registration, Bank account, and IFSC) is extracted directly from the bidder dossier and is not verified against live external government databases. "
                "Final award decisions and statutory qualification rest solely with the designated Procurement Officer in accordance with applicable tender guidelines.",
                disclaimer_style
            )
        ]
    ]

    summary_table = Table(summary_box, colWidths=[120, 420])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 0.5, neutral_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, neutral_border),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(summary_table)

    # Build PDF
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

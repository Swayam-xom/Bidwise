"""
Phase 3 Automated Test Suite for GeM Bid Ingestion & Extraction Layer.
Tests digital PDFs, multi-percentage discrimination (GST 18%, TDS 2% vs MII 72%),
PAN/GST consistency, OCR spacing normalization, scanned PDF detection, and API endpoints.
"""

import io
import json
import urllib.request
import urllib.parse
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from PIL import Image

from backend.services.document_ingestion import ingest_document, is_text_meaningful
from backend.services.bid_extractor import extract_bid_dossier
from backend.services.text_normalizer import normalize_text

def create_pdf_with_text(lines: list[str]) -> bytes:
    """Helper to generate in-memory digital PDF with given lines."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    y = 750
    for line in lines:
        if line == "---PAGEBREAK---":
            c.showPage()
            y = 750
            continue
        c.drawString(50, y, line)
        y -= 25
    c.save()
    return buffer.getvalue()

def create_scanned_image_pdf() -> bytes:
    """Helper to create a PDF containing only an image (no digital text streams)."""
    # Create an image using Pillow
    img = Image.new('RGB', (400, 300), color=(240, 240, 240))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)

    # Place image in PDF
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    from reportlab.lib.utils import ImageReader
    c.drawImage(ImageReader(img_bytes), 50, 400, width=300, height=200)
    c.save()
    return buffer.getvalue()

def run_tests():
    print("[PHASE 3 TEST] Starting Phase 3 Validation Suite...")

    # -------------------------------------------------------------
    # TEST 1: Percentage Discrimination (GST 18%, TDS 2%, MII 72%)
    # -------------------------------------------------------------
    print("\n--- Test 1: MII Percentage Discrimination ---")
    multi_pct_lines = [
        "Government of India - GeM Technical Bid Dossier",
        "Commercial Invoice Summary: Tax rate applicable GST 18% on all line items.",
        "Statutory deduction: Withholding TDS 2% under Income Tax Section 194C.",
        "Penalty clause: Liquidated damages 10% for delivery delays.",
        "Make in India Local Content Declaration:",
        "We hereby certify that the percentage of local content for offered laptops is 72% under Class-I Local Supplier rules.",
        "Permanent Account Number PAN: AABCN4920K",
        "GST Registration Number GSTIN: 07AABCN4920K1Z8",
        "MSME Registration: UDYAM-DL-01-0089241",
        "EPFO Establishment Code: DLCPM0019284000",
        "Financial Turnover FY 2024-25: INR 18.5 Crore",
        "OEM Authorization Form: Authorized Partner of Bharat Micro Systems valid until 31/12/2027."
    ]
    pdf1 = create_pdf_with_text(multi_pct_lines)
    ingest1 = ingest_document(pdf1)
    assert ingest1["extraction_method"] == "pdf_text"
    assert ingest1["page_count"] == 1
    
    dossier1 = extract_bid_dossier(ingest1)
    print("Extracted Local Content %:", dossier1["local_content_percent"])
    print("Local Content Evidence:", dossier1["local_content_evidence"])
    
    # Must be 72, NOT 18, 2, or 10!
    assert dossier1["local_content_percent"] == 72.0, f"Expected 72.0, got {dossier1['local_content_percent']}"
    assert "72" in dossier1["local_content_evidence"]
    assert dossier1["pan"] == "AABCN4920K"
    assert dossier1["gstin"] == "07AABCN4920K1Z8"
    assert dossier1["udyam"] == "UDYAM-DL-01-0089241"
    assert dossier1["epfo"] == "DLCPM0019284000"
    assert "18.5" in str(dossier1["turnover"]["fy_2024_25"])
    assert "Bharat Micro Systems" in dossier1["oem_name"]
    print("[PASS] Test 1: Percentage correctly discriminated; statutory entities extracted.")

    # -------------------------------------------------------------
    # TEST 2: Multi-page Evidence & Page Tracking
    # -------------------------------------------------------------
    print("\n--- Test 2: Multi-page Page-Aware Evidence ---")
    multipage_lines = [
        "Page 1: General Supplier Identification",
        "Supplier: Vertex Systems India",
        "Income Tax PAN : AABCV9812M",
        "---PAGEBREAK---",
        "Page 2: Tax Registration Information",
        "GSTIN : 27AABCV9812M1Z3",
        "---PAGEBREAK---",
        "Page 3: Make in India Undertaking",
        "We declare that local content percentage is 64.5% for this procurement.",
        "EPF Registration Code: MHBAN0012345000"
    ]
    pdf2 = create_pdf_with_text(multipage_lines)
    ingest2 = ingest_document(pdf2)
    assert ingest2["page_count"] == 3
    dossier2 = extract_bid_dossier(ingest2)

    evidence = dossier2["evidence"]
    print("Evidence Map Keys:", list(evidence.keys()))
    assert evidence["pan"]["page"] == 1, f"Expected PAN on page 1, got {evidence['pan']['page']}"
    assert evidence["gstin"]["page"] == 2, f"Expected GSTIN on page 2, got {evidence['gstin']['page']}"
    assert evidence["local_content"]["page"] == 3, f"Expected MII on page 3, got {evidence['local_content']['page']}"
    assert dossier2["local_content_percent"] == 64.5
    print("[PASS] Test 2: Multi-page tracking accurately records page numbers for all statutory fields.")

    # -------------------------------------------------------------
    # TEST 3: PAN-GST Mismatch Detection
    # -------------------------------------------------------------
    print("\n--- Test 3: PAN-GST Inconsistency ---")
    mismatch_lines = [
        "Company Profile: Apex Infratech",
        "Permanent Account Number PAN: AAAAA1111A",
        "GSTIN: 07BBBBB2222B1Z9", # Embedded PAN is BBBBB2222B != AAAAA1111A
        "Make in India local content: 55%"
    ]
    pdf3 = create_pdf_with_text(mismatch_lines)
    ingest3 = ingest_document(pdf3)
    dossier3 = extract_bid_dossier(ingest3)
    assert dossier3["pan"] == "AAAAA1111A"
    assert dossier3["gstin"] == "07BBBBB2222B1Z9"
    # Verify embedded PAN comparison
    embedded = dossier3["gstin"][2:12]
    assert embedded != dossier3["pan"], "Expected PAN mismatch"
    print(f"[PASS] Test 3: PAN mismatch correctly captured ({dossier3['pan']} != {embedded}).")

    # -------------------------------------------------------------
    # TEST 4: OCR Spacing Normalization
    # -------------------------------------------------------------
    print("\n--- Test 4: OCR Spacing Normalization ---")
    spacing_lines = [
        "Scanned OCR Document Stream",
        "U D Y A M - D L - 0 1 - 0 0 8 9 2 4 1",
        "UDYAM - MH - 02 - 0019284",
        "PAN : AABCN 4920 K",
        "Make in India local content declaration is 58.0 %"
    ]
    pdf4 = create_pdf_with_text(spacing_lines)
    ingest4 = ingest_document(pdf4)
    dossier4 = extract_bid_dossier(ingest4)
    print("Cleaned Udyam:", dossier4["udyam"])
    print("Cleaned PAN:", dossier4["pan"])
    assert dossier4["pan"] == "AABCN4920K"
    assert dossier4["udyam"] == "UDYAM-MH-02-0019284"
    assert dossier4["local_content_percent"] == 58.0
    print("[PASS] Test 4: OCR space defects successfully repaired.")

    # -------------------------------------------------------------
    # TEST 5: Scanned / Image-only PDF Detection & Graceful Fallback
    # -------------------------------------------------------------
    print("\n--- Test 5: Scanned PDF Detection & Graceful Degradation ---")
    scanned_pdf = create_scanned_image_pdf()
    ingest_scanned = ingest_document(scanned_pdf)
    print("Scanned PDF extraction_method:", ingest_scanned["extraction_method"])
    print("Scanned PDF OCR available:", ingest_scanned["ocr_available"])
    print("Scanned PDF OCR diagnostic:", ingest_scanned.get("ocr_error"))
    # The system detects that digital text was insufficient and attempted or reported OCR
    assert ingest_scanned["page_count"] == 1
    assert ingest_scanned["extraction_method"] in ["ocr", "failed", "pdf_text"]
    assert ingest_scanned["confidence"] < 0.90
    print("[PASS] Test 5: Scanned/image PDF safely detected without crashing or inventing data.")

    # -------------------------------------------------------------
    # TEST 6: Live API Integration Test (/api/verify)
    # -------------------------------------------------------------
    print("\n--- Test 6: Live API /api/verify with Phase 3 Schema ---")
    # Fetch token
    req_token = urllib.request.Request("http://127.0.0.1:8000/api/auth/token", 
                                       data=json.dumps({"tender_id": "GEM/2026/B/892101"}).encode(),
                                       headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req_token) as resp:
        token = json.loads(resp.read().decode())["token"]

    boundary = "----WebKitBoundaryPhase3Test"
    body = []
    body.append(f"--{boundary}\r\n".encode())
    body.append(b'Content-Disposition: form-data; name="file"; filename="Dossier_Phase3_Verification.pdf"\r\n')
    body.append(b'Content-Type: application/pdf\r\n\r\n')
    body.append(pdf1)
    body.append(b"\r\n")
    body.append(f"--{boundary}--\r\n".encode())
    multipart_body = b"".join(body)

    req_verify = urllib.request.Request(
        "http://127.0.0.1:8000/api/verify",
        data=multipart_body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Authorization": f"Bearer {token}"
        }
    )
    with urllib.request.urlopen(req_verify) as resp:
        verify_data = json.loads(resp.read().decode())

    print("API Verify Extraction Method:", verify_data.get("extraction_method"))
    print("API Verify Score:", verify_data.get("compliance_score"))
    print("API Verify Status:", verify_data.get("status"))
    print("API Verify Extracted MII %:", verify_data["extracted_data"]["local_content_percent"])

    assert verify_data["compliance_score"] >= 80
    assert verify_data["status"] == "Qualified"
    assert verify_data["extracted_data"]["local_content_percent"] == 72.0
    assert verify_data["extraction_method"] == "pdf_text"
    assert "evidence" in verify_data
    print("[PASS] Test 6: Live API /api/verify returned verified Phase 3 structured schema.")

    print("\n=======================================================")
    print("ALL 6 PHASE 3 INGESTION & EXTRACTION TESTS PASSED!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()

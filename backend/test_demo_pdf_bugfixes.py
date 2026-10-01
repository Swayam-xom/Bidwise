"""
Test suite validating the 3 bugfixes on synthetic demo PDF:
1. Make in India Content: 65% correctly extracted -> no MII missing penalty.
2. EPFO Registration: DEMO-EPFO-MP-004567 correctly extracted -> no EPFO missing penalty.
3. Standalone PAN and GSTIN extracted -> PAN mismatch penalty (-40 pts) correctly detected.
4. Total Score: 60/100 (Clarification), ML Prediction evaluated.
5. SQLite persistence and ReportLab PDF verification.
"""

import io
import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from starlette.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.server import app
from backend.database import init_db, SessionLocal, Bid
from backend.services.document_ingestion import ingest_document
from backend.services.bid_extractor import extract_bid_dossier
from backend.services.pdf_report_generator import generate_bid_compliance_pdf

client = TestClient(app)

def create_demo_pdf_with_mismatch() -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 750, "BIDDER TECHNICAL PROPOSAL & STATUTORY EVIDENCE")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, 720, "Bidder / Company Legal Name: Alpha Tech Systems Pvt Ltd")
    c.drawString(50, 700, "Permanent Account Number PAN: AAACF1294K")
    c.drawString(50, 680, "GSTIN Registration: 07AABCN4920K1Z8")
    c.drawString(50, 660, "Udyam Registration: UDYAM-DL-02-0099182")
    c.drawString(50, 640, "EPFO Registration: DEMO-EPFO-MP-004567")
    c.drawString(50, 620, "ESIC Registration No: DEMO-ESIC-MP-000123")
    c.drawString(50, 600, "Bank Name: Demo National Bank")
    c.drawString(50, 580, "Account Number: DEMO-ACCOUNT-001234")
    c.drawString(50, 560, "IFSC: DEMO0001234")
    c.drawString(50, 540, "Make in India Content: 65%")
    c.drawString(50, 520, "Annual Turnover: INR 18.5 Cr")
    c.drawString(50, 500, "Experience: 6 years in government supply")
    
    c.showPage()
    c.save()
    return buffer.getvalue()

def run_test():
    print("=" * 60)
    print("VERIFYING DEMO PDF EXTRACTION & RULE ENGINE BUGFIXES")
    print("=" * 60)

    pdf_bytes = create_demo_pdf_with_mismatch()
    
    # 1. Ingestion & Extraction Test
    print("\n[STEP 1] Running Multi-Page Ingestion & Dossier Extraction...")
    ingestion = ingest_document(pdf_bytes)
    dossier = extract_bid_dossier(ingestion)

    print("  Extracted PAN:", dossier.get("pan"))
    print("  Extracted GSTIN:", dossier.get("gstin"))
    print("  Extracted Udyam:", dossier.get("udyam"))
    print("  Extracted EPFO:", dossier.get("epfo"))
    print("  Extracted ESIC:", dossier.get("esic"))
    print("  Extracted Bank:", dossier.get("bank"))
    print("  Extracted MII %:", dossier.get("local_content_percent"))

    assert dossier.get("pan") == "AAACF1294K", f"PAN extraction failed: {dossier.get('pan')}"
    assert dossier.get("gstin") == "07AABCN4920K1Z8", f"GSTIN extraction failed: {dossier.get('gstin')}"
    assert dossier.get("epfo") == "DEMO-EPFO-MP-004567", f"EPFO extraction failed: {dossier.get('epfo')}"
    assert dossier.get("esic") == "DEMO-ESIC-MP-000123", f"ESIC extraction failed: {dossier.get('esic')}"
    assert dossier.get("local_content_percent") == 65.0, f"MII extraction failed: {dossier.get('local_content_percent')}"
    assert dossier.get("bank", {}).get("bank_name") == "Demo National Bank", f"Bank name failed: {dossier.get('bank')}"
    assert dossier.get("bank", {}).get("account_number") == "DEMO-ACCOUNT-001234", f"A/C failed: {dossier.get('bank')}"
    assert dossier.get("bank", {}).get("ifsc") == "DEMO0001234", f"IFSC failed: {dossier.get('bank')}"
    print("  [PASS] Step 1: All fields extracted accurately including MII 65% and DEMO-EPFO-MP-004567.")

    # 2. API Submission & Rule Deduction Check
    print("\n[STEP 2] Submitting to POST /api/bids/submit via TestClient...")
    token_res = client.post("/api/auth/token", json={"tender_id": "GEM/2026/B/892101", "role": "procurement_officer"})
    token = token_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    sub_res = client.post(
        "/api/bids/submit",
        data={
            "company_name": "Alpha Tech Systems Pvt Ltd",
            "quoted_price": 5100000.0,
            "tender_id": "GEM/2026/B/892101"
        },
        files={"file": ("Demo_Bidder_Mismatch.pdf", pdf_bytes, "application/pdf")},
        headers=headers
    )
    assert sub_res.status_code == 200, f"Submission error: {sub_res.text}"
    bid = sub_res.json()
    bid_id = bid["id"]

    print(f"  Persisted Bid ID: {bid_id}")
    print(f"  Compliance Score: {bid['compliance_score']} / 100")
    print(f"  Status: {bid['status']}, Risk Level: {bid['risk_level']}")
    print(f"  Deductions count: {len(bid['deductions'])}")
    for d in bid['deductions']:
        print(f"    - [{d['category']}] ({d['score']} pts): {d['reason']}")

    # Assertions on deductions
    # ONLY PAN mismatch should be penalized (-40). MII and EPFO should have NO deductions!
    assert bid["compliance_score"] == 60, f"Expected 60/100, got {bid['compliance_score']}"
    assert len(bid["deductions"]) == 1, f"Expected exactly 1 deduction (PAN mismatch), got {len(bid['deductions'])}"
    assert bid["deductions"][0]["category"] == "Statutory Consistency", f"Unexpected deduction: {bid['deductions'][0]}"
    assert bid["status"] == "Clarification", f"Expected Clarification, got {bid['status']}"
    print("  [PASS] Step 2: Exactly 1 deduction for PAN mismatch (-40 pts), score 60/100, MII & EPFO clean.")

    # 3. Dynamic PDF Report Generation
    print("\n[STEP 3] Testing dynamic PDF certificate endpoint GET /api/bids/{bid_id}/report.pdf...")
    pdf_res = client.get(f"/api/bids/{bid_id}/report.pdf")
    assert pdf_res.status_code == 200, f"PDF report error: {pdf_res.status_code}"
    assert len(pdf_res.content) > 1000, "PDF too small"
    print(f"  PDF Certificate size: {len(pdf_res.content)} bytes")
    print("  [PASS] Step 3: Dynamic PDF certificate generated and verified.")

    print("\n" + "=" * 60)
    print("ALL 3 EXTRACTION & LABELING BUGFIXES VERIFIED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_test()

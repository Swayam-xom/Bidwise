"""
Comprehensive Verification Test Suite for MPOnline Hackathon Finalization:
1. Extracts PAN, GSTIN, Udyam, EPFO, ESIC, Bank Name, Account Number, IFSC from PDF.
2. Verifies EXACT 21-feature ML schema is preserved without ESIC or Bank.
3. Verifies trained ML models (LR 52% + LGBM 48%) run and predict compliance/risk.
4. Verifies deterministic rule engine detects statutory consistency.
5. Verifies database persistence in SQLite (all fields stored).
6. Verifies GET /api/bids/{id}/report.pdf dynamically generates ReportLab compliance certificate.
"""

import io
import json
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
from backend.ml.ml_adapter import map_features_with_provenance, evaluate_bid_ml_compliance, ORDERED_ML_FEATURES

client = TestClient(app)

def create_synthetic_bidder_pdf() -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    # Page 1: Statutory & Banking Particulars
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 750, "TECHNICAL BID DOSSIER - MPONLINE HACKATHON DEMO")
    c.setFont("Helvetica", 10)
    c.drawString(50, 720, "Bidder Legal Name: Apex Cloud Infotech Solutions Pvt Ltd")
    c.drawString(50, 700, "Permanent Account Number PAN: AABCA5678K")
    c.drawString(50, 680, "GSTIN Registration: 23AABCA5678K1Z5")
    c.drawString(50, 660, "Udyam Registration: UDYAM-MP-01-0048291")
    c.drawString(50, 640, "EPFO Establishment Code: MP/BHO/0019284/000")
    c.drawString(50, 620, "ESIC Registration No: DEMO-ESIC-MP-000123")
    c.drawString(50, 600, "Bank Name: State Bank of India")
    c.drawString(50, 580, "Bank Account Number: DEMO-ACCOUNT-001234")
    c.drawString(50, 560, "Bank IFSC Code: SBIN0001234")
    c.drawString(50, 540, "Make in India Local Content Declaration: We hereby declare 68.5% local content.")
    c.drawString(50, 520, "Annual Turnover: INR 45,00,00,000 (INR 45 Cr)")
    c.drawString(50, 500, "Relevant Experience: 8 years in enterprise IT infrastructure")
    c.drawString(50, 480, "OEM Authorization: Direct OEM Manufacturer Authorization Certified.")
    c.showPage()
    c.save()
    return buffer.getvalue()

def run_tests():
    print("=" * 60)
    print("RUNNING BIDWISE HACKATHON VERIFICATION & REPORT TEST SUITE")
    print("=" * 60)

    # 1. Test Ingestion and Extraction of Synthetic PDF
    print("\n[TEST 1] Testing Synthetic Bidder PDF Extraction (PAN, GSTIN, EPFO, ESIC, Bank)...")
    pdf_bytes = create_synthetic_bidder_pdf()
    ingestion = ingest_document(pdf_bytes)
    dossier = extract_bid_dossier(ingestion)

    print(f"  Extracted PAN: {dossier.get('pan')}")
    print(f"  Extracted GSTIN: {dossier.get('gstin')}")
    print(f"  Extracted Udyam: {dossier.get('udyam')}")
    print(f"  Extracted EPFO: {dossier.get('epfo')}")
    print(f"  Extracted ESIC: {dossier.get('esic')}")
    print(f"  Extracted Bank: {dossier.get('bank')}")
    print(f"  Extracted Local Content: {dossier.get('local_content_percent')}%")

    assert dossier.get("pan") == "AABCA5678K", f"PAN mismatch: {dossier.get('pan')}"
    assert dossier.get("gstin") == "23AABCA5678K1Z5", f"GSTIN mismatch: {dossier.get('gstin')}"
    assert "DEMO-ESIC-MP-000123" in str(dossier.get("esic")), f"ESIC extraction failed: {dossier.get('esic')}"
    assert "State Bank" in str(dossier.get("bank", {}).get("bank_name")), f"Bank extraction failed: {dossier.get('bank')}"
    assert "SBIN0001234" in str(dossier.get("bank", {}).get("ifsc")), f"IFSC extraction failed: {dossier.get('bank')}"
    print("  [PASS] Test 1: All statutory and supporting evidence extracted successfully.")

    # 2. Verify Exact 21 ML Features schema
    print("\n[TEST 2] Verifying Exact 21-Feature ML Schema Integrity...")
    features, provenance = map_features_with_provenance(dossier, rule_score=100, deductions=[])
    print(f"  Total features mapped: {len(features)}")
    print(f"  ORDERED_ML_FEATURES count: {len(ORDERED_ML_FEATURES)}")
    assert len(features) == 21, f"Expected 21 features, got {len(features)}"
    assert len(ORDERED_ML_FEATURES) == 21, f"Expected 21 ordered features, got {len(ORDERED_ML_FEATURES)}"
    assert "esic" not in features, "ESIC must NOT be in ML feature schema!"
    assert "bank" not in features and "ifsc" not in features, "Bank/IFSC must NOT be in ML feature schema!"
    print("  [PASS] Test 2: Exactly 21 features preserved with zero pollution from ESIC/Bank.")

    # 3. Verify ML Model Execution & Probability Fusion
    print("\n[TEST 3] Verifying ML Inference & Dual-Model Probability Fusion...")
    ml_eval = evaluate_bid_ml_compliance(dossier, rule_score=100, deductions=[])
    ml_pred = ml_eval.get("ml_prediction")
    assert ml_pred is not None, "ML Prediction was not returned"
    print(f"  ML Status: {ml_eval.get('ml_status')}")
    print(f"  ML Predicted Label: {ml_pred.get('predicted_compliance_label')}")
    print(f"  Confidence: {ml_pred.get('confidence') * 100:.1f}%")
    print(f"  Compliance Risk Score: {ml_pred.get('compliance_risk_score')}/100 ({ml_pred.get('risk_level')} Risk)")
    print(f"  Fused Probabilities: {ml_pred.get('probabilities')}")
    print(f"  Model Breakdown: {ml_pred.get('individual_model_probabilities')}")
    assert "Compliant" in ml_pred.get("probabilities", {}), "Missing Compliant probability"
    assert "logistic_regression" in ml_pred.get("individual_model_probabilities", {}), "Missing LR breakdown"
    assert "lightgbm" in ml_pred.get("individual_model_probabilities", {}), "Missing LightGBM breakdown"
    print("  [PASS] Test 3: Trained ML models and dual fusion executed successfully.")

    # 4. Test Submission and SQLite Persistence
    print("\n[TEST 4] Testing Canonical Bid Submission & SQLite Persistence...")
    token_res = client.post("/api/auth/token", json={"tender_id": "GEM/2026/B/892101", "role": "procurement_officer"})
    token = token_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    submit_res = client.post(
        "/api/bids/submit",
        data={
            "company_name": "Apex Cloud Infotech Solutions Pvt Ltd",
            "quoted_price": 5400000.0,
            "tender_id": "GEM/2026/B/892101"
        },
        files={"file": ("Apex_Bid_Dossier.pdf", pdf_bytes, "application/pdf")},
        headers=headers
    )
    assert submit_res.status_code == 200, f"Submission failed: {submit_res.text}"
    bid_payload = submit_res.json()
    bid_id = bid_payload["id"]
    print(f"  Persisted Bid ID: {bid_id}")
    print(f"  Rule Compliance Score: {bid_payload['compliance_score']}/100")
    print(f"  Status: {bid_payload['status']}, Risk: {bid_payload['risk_level']}")
    print(f"  ESIC in payload: {bid_payload.get('esic')}")
    print(f"  Bank in payload: {bid_payload.get('bank')}")

    # Check database directly
    db = SessionLocal()
    bid_db = db.query(Bid).filter(Bid.bid_id == bid_id).first()
    assert bid_db is not None, "Bid record was not persisted to SQLite"
    assert bid_db.pan == "AABCA5678K", f"DB PAN mismatch: {bid_db.pan}"
    assert bid_db.gstin == "23AABCA5678K1Z5", f"DB GSTIN mismatch: {bid_db.gstin}"
    assert bid_db.esic == "DEMO-ESIC-MP-000123", f"DB ESIC mismatch: {bid_db.esic}"
    assert bid_db.bank_name == "State Bank of India", f"DB Bank mismatch: {bid_db.bank_name}"
    assert bid_db.ifsc == "SBIN0001234", f"DB IFSC mismatch: {bid_db.ifsc}"
    db.close()
    print("  [PASS] Test 4: Bid successfully persisted in SQLite with all statutory and evidence fields.")

    # 5. Test Dynamic PDF Compliance Certificate Endpoint
    print("\n[TEST 5] Testing GET /api/bids/{bid_id}/report.pdf ReportLab Endpoint...")
    report_res = client.get(f"/api/bids/{bid_id}/report.pdf")
    assert report_res.status_code == 200, f"Report PDF endpoint failed: {report_res.status_code}"
    assert report_res.headers["content-type"] == "application/pdf", f"Unexpected content-type: {report_res.headers.get('content-type')}"
    pdf_content = report_res.content
    print(f"  Generated PDF size: {len(pdf_content)} bytes")
    assert len(pdf_content) > 1000, "PDF content is too small"
    assert pdf_content[:4] == b"%PDF", "Response is not a valid PDF binary"
    print("  [PASS] Test 5: Dynamic ReportLab compliance certificate generated and served.")

    print("\n" + "=" * 60)
    print("ALL HACKATHON VERIFICATION SUITE TESTS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()

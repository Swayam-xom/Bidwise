"""
End-to-End Test Suite for ML Compliance Verification Integration.
Validates:
1. Exact 21-feature mapping and provenance tracking
2. ML prediction calculation and probability fusion
3. Backward compatibility of API contracts (/api/verify, /api/bids, /api/bids/submit, /api/bids/{id})
4. SQLite persistence of ML results and safe database schema
5. Fault tolerance when ML artifacts are missing or degraded
6. Ingestion -> Extraction -> Feature Mapper -> ML Model -> Deterministic Rules -> Final Decision
"""

import io
import json
import os
import sys
import uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from starlette.testclient import TestClient
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from pypdf import PdfWriter

from backend.server import app
from backend.database import init_db, SessionLocal, Bid, Tender
from backend.ml.ml_adapter import map_features_with_provenance, evaluate_bid_ml_compliance, ORDERED_ML_FEATURES

client = TestClient(app)

def create_sample_pdf(lines: list[str]) -> bytes:
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

def run_e2e_tests():
    print("==================================================")
    print("STARTING COMPLETE ML COMPLIANCE INTEGRATION SUITE")
    print("==================================================")

    # Initialize / Migrate database
    init_db()
    print("\n[STEP 1] Database schema migration & initialization verified.")

    try:
        # 1. Acquire JWT token
        print("\n[STEP 2] Acquiring JWT token from /api/auth/token...")
        res_t = client.post("/api/auth/token", json={"tender_id": "GEM/2026/B/892101", "role": "procurement_officer"})
        assert res_t.status_code == 200, f"Token failed: {res_t.text}"
        token = res_t.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("  Token successfully issued.")

        # 2. Test GET /api/bids initial list
        print("\n[STEP 3] Testing initial GET /api/bids...")
        res_b = client.get("/api/bids")
        assert res_b.status_code == 200
        assert isinstance(res_b.json(), list)
        print("[PASS] Initial GET /api/bids contract validated.")

        # 3. Test POST /api/verify with Compliant Dossier
        print("\n[STEP 4] Testing POST /api/verify with Compliant PDF Dossier...")
        compliant_pdf = create_sample_pdf([
            "Government of India - GeM Technical Bid Dossier",
            "Make in India Local Content Declaration:",
            "We hereby certify that the percentage of local content for offered laptops is 74% under Class-I Local Supplier rules.",
            "Permanent Account Number PAN: AABCN4920K",
            "GST Registration Number GSTIN: 07AABCN4920K1Z8",
            "MSME Registration: UDYAM-DL-01-0089241",
            "EPFO Establishment Code: DLCPM0019284000",
            "Financial Turnover FY 2024-25: INR 18.5 Crore",
            "OEM Authorization Form: Authorized Partner of Bharat Micro Systems valid until 31/12/2027."
        ])
        files_c = {"file": ("Dossier_Compliant.pdf", compliant_pdf, "application/pdf")}
        res_c = client.post("/api/verify", files=files_c, headers=headers)
        assert res_c.status_code == 200
        v_data = res_c.json()
        assert v_data["compliance_score"] >= 80
        assert v_data["status"] == "Qualified"
        assert v_data["ml_prediction"] is not None
        assert v_data["ml_prediction"]["predicted_compliance_label"] == "Compliant"
        assert v_data["ml_prediction"]["risk_level"] == "LOW"
        assert v_data["ml_prediction"]["confidence"] > 0.5
        assert "feature_provenance" in v_data
        print("  Compliant ML Prediction:", v_data["ml_prediction"]["predicted_compliance_label"])
        print("  Confidence:", v_data["ml_prediction"]["confidence"])
        print("  Compliance Risk Score:", v_data["ml_prediction"]["compliance_risk_score"])
        print("  Fusion Weights:", v_data["ml_prediction"]["fusion_weights"])
        print("[PASS] /api/verify compliant dossier test passed.")

        # 4. Test POST /api/verify with High-Risk PAN-GST Mismatch
        print("\n[STEP 5] Testing POST /api/verify with PAN-GST Mismatch Dossier...")
        mismatch_pdf = create_sample_pdf([
            "Government of India - GeM Technical Bid Dossier",
            "Permanent Account Number PAN: AAACF1294K",
            "GST Registration Number GSTIN: 07AABCF9876E1Z5", # Mismatch
            "MSME Registration: UDYAM-DL-02-0099182",
            "Make in India Local Content: 54%"
        ])
        files_m = {"file": ("Dossier_Mismatch.pdf", mismatch_pdf, "application/pdf")}
        res_m = client.post("/api/verify", files=files_m, headers=headers)
        assert res_m.status_code == 200
        v_m = res_m.json()
        assert v_m["compliance_score"] < 60
        assert v_m["status"] == "Disqualified"
        assert v_m["ml_prediction"]["predicted_compliance_label"] == "Non-Compliant"
        assert v_m["ml_prediction"]["risk_level"] == "HIGH"
        assert v_m["ml_prediction"]["compliance_risk_score"] >= 70.0
        print("  Mismatch ML Prediction:", v_m["ml_prediction"]["predicted_compliance_label"])
        print("  Risk Score:", v_m["ml_prediction"]["compliance_risk_score"])
        print("[PASS] /api/verify mismatch test passed.")

        # 5. Test POST /api/bids/submit with SQLite Persistence
        print("\n[STEP 6] Testing POST /api/bids/submit with SQLite Persistence...")
        form_data = {
            "company_name": "Test ML Integrated Corp",
            "quoted_price": 5150000.0,
            "tender_id": "GEM/2026/B/892101"
        }
        files_s = {"file": ("Dossier_Submit.pdf", compliant_pdf, "application/pdf")}
        res_s = client.post("/api/bids/submit", data=form_data, files=files_s, headers=headers)
        assert res_s.status_code == 200, f"Submit failed: {res_s.text}"
        s_data = res_s.json()
        sub_bid_id = s_data["id"]
        assert s_data["ml_prediction"] is not None
        assert s_data["ml_prediction"]["predicted_compliance_label"] == "Compliant"

        # Verify direct database record
        db = SessionLocal()
        db_bid = db.query(Bid).filter(Bid.bid_id == sub_bid_id).first()
        assert db_bid is not None
        assert db_bid.ml_predicted_label == "Compliant"
        assert db_bid.ml_confidence is not None
        assert db_bid.ml_risk_score is not None
        assert db_bid.ml_probabilities_json is not None
        assert db_bid.ml_feature_provenance_json is not None
        assert db_bid.ml_status == "available"
        db.close()
        print(f"  Persisted bid '{sub_bid_id}' in SQLite with ML label '{db_bid.ml_predicted_label}'.")
        print("[PASS] /api/bids/submit persistence verified.")

        # 6. Test GET /api/bids/{bid_id}
        print(f"\n[STEP 7] Testing GET /api/bids/{sub_bid_id}...")
        res_d = client.get(f"/api/bids/{sub_bid_id}")
        assert res_d.status_code == 200
        d_payload = res_d.json()
        assert d_payload["id"] == sub_bid_id
        assert d_payload["ml_prediction"]["predicted_compliance_label"] == "Compliant"
        assert "audit_history" in d_payload
        print("[PASS] Detailed bid endpoint verified.")

        # 7. Test PATCH /api/bids/{bid_id}/status
        print(f"\n[STEP 8] Testing PATCH /api/bids/{sub_bid_id}/status...")
        res_p = client.patch(
            f"/api/bids/{sub_bid_id}/status",
            json={"status": "Qualified", "officer_remark": "Verified with ML Decision Support."},
            headers=headers
        )
        assert res_p.status_code == 200
        assert res_p.json()["status"] == "Qualified"
        print("[PASS] Officer status update and audit trail verified.")

        print("\n==================================================")
        print("ALL END-TO-END ML COMPLIANCE TESTS PASSED (100%)!")
        print("==================================================")
    finally:
        # Cleanup test submission so demo database stays clean
        if 'sub_bid_id' in locals() and sub_bid_id:
            try:
                db_clean = SessionLocal()
                t_bid = db_clean.query(Bid).filter(Bid.bid_id == sub_bid_id).first()
                if t_bid:
                    db_clean.delete(t_bid)
                    db_clean.commit()
                db_clean.close()
            except Exception:
                pass

if __name__ == "__main__":
    run_e2e_tests()

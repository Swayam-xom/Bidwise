import io
import json
import urllib.parse
import sys
import os
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_pdf(fields):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    y = 750
    for k, v in fields.items():
        c.drawString(100, y, f"{k}: {v}")
        y -= 30
    c.save()
    return buf.getvalue()

def run_audit():
    auth_res = requests.post("http://127.0.0.1:8000/api/auth/token", json={"tender_id": "GEM/2026/B/892101", "role": "procurement_officer"})
    token = auth_res.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}

    scenarios = [
        {
            "name": "Scenario 1: Missing MII Declaration",
            "data": {
                "Company": "Scenario 1 Tech Ltd",
                "Permanent Account Number PAN": "AABCS1111K",
                "GST Registration Number GSTIN": "07AABCS1111K1Z5",
                "EPFO Registration": "DLCPM0019284000",
                "Financial Turnover": "INR 15.0 Cr"
            },
            "quote": 4100000.0
        },
        {
            "name": "Scenario 2: MII Below 50% (26.0%)",
            "data": {
                "Company": "Scenario 2 Imports Ltd",
                "Permanent Account Number PAN": "AABCS2222K",
                "GST Registration Number GSTIN": "07AABCS2222K1Z5",
                "EPFO Registration": "DLCPM0019284000",
                "Make in India Local Content": "26.0%",
                "Financial Turnover": "INR 15.0 Cr"
            },
            "quote": 4050000.0
        },
        {
            "name": "Scenario 3: PAN-GST Mismatch",
            "data": {
                "Company": "Scenario 3 Forged Ltd",
                "Permanent Account Number PAN": "AAAAA1111A",
                "GST Registration Number GSTIN": "07BBBBB2222B1Z5",
                "EPFO Registration": "DLCPM0019284000",
                "Make in India Local Content": "72.0%",
                "Financial Turnover": "INR 15.0 Cr"
            },
            "quote": 3900000.0
        },
        {
            "name": "Scenario 4: Valid Fully Compliant Bidder",
            "data": {
                "Company": "Scenario 4 Compliant Ltd",
                "Permanent Account Number PAN": "AABCS4444K",
                "GST Registration Number GSTIN": "07AABCS4444K1Z5",
                "EPFO Registration": "DLCPM0019284000",
                "Make in India Local Content": "68.0%",
                "Financial Turnover": "INR 15.0 Cr"
            },
            "quote": 4850000.0
        }
    ]

    print("======================================================================")
    print("PROCUREMENT ELIGIBILITY & L1 CHAIN VERIFICATION AUDIT")
    print("======================================================================")

    encoded_tender = urllib.parse.quote("GEM/2026/B/892101", safe="")

    for sc in scenarios:
        s_name = sc["name"]
        print(f"\n>>> Testing {s_name} <<<")
        pdf_bytes = create_pdf(sc["data"])
        
        # 1. Test /api/verify
        verify_res = requests.post("http://127.0.0.1:8000/api/verify", files={"file": ("test.pdf", pdf_bytes, "application/pdf")}, headers=headers)
        v_data = verify_res.json()
        score = v_data.get("compliance_score")
        status = v_data.get("status")
        deductions = v_data.get("deductions") or []
        ml_pred = v_data.get("ml_prediction") or {}
        
        print(f"  [Statutory Rule Result] Score: {score}/100, Deductions Count: {len(deductions)}")
        for d in deductions:
            print(f"    - Penalty: {d.get('score')} pts | {d.get('category')}: {d.get('reason')}")
        print(f"  [ML Advisory] Prediction: {ml_pred.get('predicted_compliance_label')} (Risk Score: {ml_pred.get('compliance_risk_score')})")
        print(f"  [Final Eligibility Status] {status}")
        
        # 2. Test Submit to DB
        files = {"file": ("test.pdf", pdf_bytes, "application/pdf")}
        submit_data = {"tender_id": "GEM/2026/B/892101", "company_name": sc["data"]["Company"], "quoted_price": str(sc["quote"])}
        sub_res = requests.post("http://127.0.0.1:8000/api/bids/submit", files=files, data=submit_data, headers=headers)
        bid_id = sub_res.json().get("bid_id")
        print(f"  [Persisted Bid ID] {bid_id}")
        
        # 3. Test L1 Candidate Filtering
        is_in_l1_pool = (status.upper() == "QUALIFIED")
        print(f"  [L1 Candidate Pool Inclusion] Eligible for L1 Ranking: {is_in_l1_pool}")
        
        # Reset tender to Active for clean award test
        from backend.database import SessionLocal, Tender
        db_s = SessionLocal()
        t = db_s.query(Tender).filter(Tender.tender_id == "GEM/2026/B/892101").first()
        if t:
            t.status = "Active"
            t.awarded_bid_id = None
            db_s.commit()
        db_s.close()

        # 4. Test Award Endpoint Attempt
        award_res = requests.post(f"http://127.0.0.1:8000/api/tenders/{encoded_tender}/award", json={"bid_id": bid_id}, headers=headers)
        resp_detail = award_res.json().get("detail", award_res.json().get("status"))
        print(f"  [Award Endpoint Result] HTTP {award_res.status_code} | {resp_detail}")
        
        # Cleanup submitted bid & restore Active tender
        requests.delete(f"http://127.0.0.1:8000/api/bids/{bid_id}", headers=headers)
        db_s = SessionLocal()
        t = db_s.query(Tender).filter(Tender.tender_id == "GEM/2026/B/892101").first()
        if t:
            t.status = "Active"
            t.awarded_bid_id = None
            db_s.commit()
        db_s.close()

    print("\n======================================================================")
    print("AUDIT COMPLETE")
    print("======================================================================")

if __name__ == "__main__":
    run_audit()

import urllib.request
import urllib.parse
import json
import uuid
import sys
import io
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://127.0.0.1:8000"

def log(msg):
    print(f"[TEST] {msg}")

def request(method, path, data=None, headers=None):
    url = f"{BASE_URL}{path}"
    headers = headers or {}
    req = urllib.request.Request(url, method=method)
    for k, v in headers.items():
        req.add_header(k, v)
    
    body = None
    if data is not None:
        if isinstance(data, (dict, list)):
            body = json.dumps(data).encode("utf-8")
            req.add_header("Content-Type", "application/json")
        elif isinstance(data, bytes):
            body = data
    
    try:
        with urllib.request.urlopen(req, data=body, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"raw": err_body}

def run_tests():
    created_bid_ids = []
    try:
        log("1. Fetching JWT session token from /api/auth/token...")
        status, token_resp = request("POST", "/api/auth/token", {
            "tender_id": "GEM/2026/B/892101",
            "role": "procurement_officer"
        })
        assert status == 200, f"Token request failed: {token_resp}"
        token = token_resp["token"]
        auth_headers = {"Authorization": f"Bearer {token}"}
        log("Token successfully acquired.")

        log("2. Testing GET /api/bids on initial database...")
        status, bids = request("GET", "/api/bids")
        assert status == 200, f"GET /api/bids failed: {bids}"
        assert isinstance(bids, list), "Expected list of bids"
        log(f"GET /api/bids returned {len(bids)} bids.")

        log("3. Testing POST /api/bids/submit with compliant test PDF...")
        pdf_bytes_io = io.BytesIO()
        c = canvas.Canvas(pdf_bytes_io, pagesize=letter)
        c.drawString(100, 750, "Government of India - GeM Bid Submission")
        c.drawString(100, 720, "Permanent Account Number PAN: AABCN4920K")
        c.drawString(100, 690, "GST Registration Number GSTIN: 07AABCN4920K1Z8")
        c.drawString(100, 660, "MSME Registration: UDYAM-DL-01-0089241")
        c.drawString(100, 630, "Make in India Local Content: 68.4%")
        c.drawString(100, 600, "EPFO Registration: DLCPM0019284000")
        c.save()
        pdf_data = pdf_bytes_io.getvalue()

        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        body_parts = []
        body_parts.append(f"--{boundary}\r\n".encode("utf-8"))
        body_parts.append(b'Content-Disposition: form-data; name="file"; filename="Test_Bid_Submission.pdf"\r\n')
        body_parts.append(b'Content-Type: application/pdf\r\n\r\n')
        body_parts.append(pdf_data)
        body_parts.append(b"\r\n")

        fields = {
            "tender_id": "GEM/2026/B/892101",
            "company_name": "Zenith Quantum Infotech",
            "quoted_price": "5100000"
        }
        for k, v in fields.items():
            body_parts.append(f"--{boundary}\r\n".encode("utf-8"))
            body_parts.append(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode("utf-8"))
            body_parts.append(v.encode("utf-8"))
            body_parts.append(b"\r\n")
        body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))

        multipart_body = b"".join(body_parts)
        multipart_headers = {
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Authorization": f"Bearer {token}"
        }

        status, submit_res = request("POST", "/api/bids/submit", multipart_body, headers=multipart_headers)
        assert status == 200, f"Submit bid failed: {submit_res}"
        assert "bid_id" in submit_res
        assert "compliance_score" in submit_res
        assert "status" in submit_res
        assert "risk_level" in submit_res
        assert "extracted_data" in submit_res
        assert "deductions" in submit_res
        new_bid_id = submit_res["bid_id"]
        created_bid_ids.append(new_bid_id)
        log(f"POST /api/bids/submit created persistent bid '{new_bid_id}' with compliance score {submit_res['compliance_score']}.")

        log(f"4. Testing GET /api/bids/{new_bid_id}...")
        status, single_bid = request("GET", f"/api/bids/{new_bid_id}")
        assert status == 200, f"GET /api/bids/{new_bid_id} failed: {single_bid}"
        assert single_bid["id"] == new_bid_id
        assert "extracted_data" in single_bid
        assert "audit_history" in single_bid
        log(f"GET /api/bids/{new_bid_id} successfully returned structured record.")

        log(f"5. Testing PATCH /api/bids/{new_bid_id}/status...")
        status, patch_res = request("PATCH", f"/api/bids/{new_bid_id}/status", {
            "status": "Qualified",
            "officer_remark": "Verified during automated integration testing."
        }, headers=auth_headers)
        assert status == 200, f"PATCH /api/bids/{new_bid_id}/status failed: {patch_res}"
        assert patch_res["status"] == "Qualified"
        log("PATCH /api/bids status update and audit log creation verified.")

        log("6. Verifying submitted bid is persisted in GET /api/bids...")
        status, updated_bids = request("GET", "/api/bids")
        assert status == 200
        found = any(b["id"] == new_bid_id for b in updated_bids)
        assert found, f"New bid {new_bid_id} not found in GET /api/bids"
        log("Submitted bid successfully confirmed in SQLite bids list.")

        # Create a Disqualified test bid for award testing
        log("7. Creating a Disqualified test bid for Award Rule 1 validation...")
        pdf_disq_io = io.BytesIO()
        c_disq = canvas.Canvas(pdf_disq_io, pagesize=letter)
        c_disq.drawString(100, 750, "Disqualified Low MII Bid")
        c_disq.drawString(100, 720, "PAN: AAACG4410R")
        c_disq.drawString(100, 690, "GSTIN: 29AAACG4410R1Z2")
        c_disq.drawString(100, 660, "Make in India Local Content: 18.0%")
        c_disq.save()

        boundary_d = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        b_parts_d = [
            f"--{boundary_d}\r\n".encode(),
            b'Content-Disposition: form-data; name="file"; filename="Disq_Bid.pdf"\r\n',
            b'Content-Type: application/pdf\r\n\r\n',
            pdf_disq_io.getvalue(),
            b"\r\n",
            f"--{boundary_d}\r\n".encode(),
            b'Content-Disposition: form-data; name="tender_id"\r\n\r\n',
            b"GEM/2026/B/892101\r\n",
            f"--{boundary_d}\r\n".encode(),
            b'Content-Disposition: form-data; name="company_name"\r\n\r\n',
            b"Disqualified Imports Ltd\r\n",
            f"--{boundary_d}\r\n".encode(),
            b'Content-Disposition: form-data; name="quoted_price"\r\n\r\n',
            b"4200000\r\n",
            f"--{boundary_d}--\r\n".encode()
        ]
        status, res_disq = request("POST", "/api/bids/submit", b"".join(b_parts_d), headers={
            "Content-Type": f"multipart/form-data; boundary={boundary_d}",
            "Authorization": f"Bearer {token}"
        })
        assert status == 200
        disq_bid_id = res_disq["bid_id"]
        created_bid_ids.append(disq_bid_id)

        # Create a true L1 Qualified test bid (4,800,000 quote, lower than 5,100,000)
        log("8. Creating lower-priced L1 Qualified bid (4,800,000 quote)...")
        pdf_l1_io = io.BytesIO()
        c_l1 = canvas.Canvas(pdf_l1_io, pagesize=letter)
        c_l1.drawString(100, 750, "True L1 Qualified Bid")
        c_l1.drawString(100, 720, "PAN: AAACA5812B")
        c_l1.drawString(100, 690, "GSTIN: 27AAACA5812B1ZX")
        c_l1.drawString(100, 660, "Make in India Local Content: 65.0%")
        c_l1.drawString(100, 630, "EPFO Registration: MHBAN0028491000")
        c_l1.save()

        boundary_l1 = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        b_parts_l1 = [
            f"--{boundary_l1}\r\n".encode(),
            b'Content-Disposition: form-data; name="file"; filename="L1_Bid.pdf"\r\n',
            b'Content-Type: application/pdf\r\n\r\n',
            pdf_l1_io.getvalue(),
            b"\r\n",
            f"--{boundary_l1}\r\n".encode(),
            b'Content-Disposition: form-data; name="tender_id"\r\n\r\n',
            b"GEM/2026/B/892101\r\n",
            f"--{boundary_l1}\r\n".encode(),
            b'Content-Disposition: form-data; name="company_name"\r\n\r\n',
            b"Apex CyberSystems India\r\n",
            f"--{boundary_l1}\r\n".encode(),
            b'Content-Disposition: form-data; name="quoted_price"\r\n\r\n',
            b"4800000\r\n",
            f"--{boundary_l1}--\r\n".encode()
        ]
        status, res_l1 = request("POST", "/api/bids/submit", b"".join(b_parts_l1), headers={
            "Content-Type": f"multipart/form-data; boundary={boundary_l1}",
            "Authorization": f"Bearer {token}"
        })
        assert status == 200
        true_l1_bid_id = res_l1["bid_id"]
        created_bid_ids.append(true_l1_bid_id)

        encoded_tender_id = urllib.parse.quote("GEM/2026/B/892101", safe="")

        log("9. Testing Award Endpoint Rule 1: Cannot award a Disqualified bid...")
        status, award_err = request("POST", f"/api/tenders/{encoded_tender_id}/award", {
            "bid_id": disq_bid_id
        }, headers=auth_headers)
        assert status == 400, f"Expected 400 for Disqualified bid award, got {status}: {award_err}"
        log("Rule 1 verified: Non-qualified bid correctly blocked from award.")

        log(f"10. Testing Award Endpoint Rule 2: Cannot award non-L1 bid ({new_bid_id}) if lower compliant quote ({true_l1_bid_id}) exists...")
        status, non_l1_err = request("POST", f"/api/tenders/{encoded_tender_id}/award", {
            "bid_id": new_bid_id
        }, headers=auth_headers)
        assert status == 400, f"Expected 400 for non-L1 bid award, got {status}: {non_l1_err}"
        log("Rule 2 verified: Higher-priced compliant bid correctly blocked from award.")

        log(f"11. Testing Award Endpoint Rule 3: Awarding valid L1 bid ({true_l1_bid_id})...")
        status, award_ok = request("POST", f"/api/tenders/{encoded_tender_id}/award", {
            "bid_id": true_l1_bid_id
        }, headers=auth_headers)
        assert status == 200, f"Expected 200 for valid L1 award, got {status}: {award_ok}"
        assert award_ok["success"] is True
        assert award_ok["awarded_bid_id"] == true_l1_bid_id
        assert award_ok["status"] == "Awarded"
        log(f"Rule 3 verified: Valid L1 bid {true_l1_bid_id} successfully awarded.")

        log("12. Testing Award Endpoint Rule 4: Duplicate award blocked after evaluation frozen...")
        status, dup_err = request("POST", f"/api/tenders/{encoded_tender_id}/award", {
            "bid_id": true_l1_bid_id
        }, headers=auth_headers)
        assert status == 400, f"Expected 400 for duplicate award on frozen tender, got {status}: {dup_err}"
        log("Rule 4 verified: Duplicate award on frozen tender correctly blocked.")

        log("ALL BACKEND API PHASE 2 TESTS PASSED!")
    finally:
        # Isolated Test Teardown: Clean up all test bids and restore active tender
        try:
            from backend.database import SessionLocal, Tender, Bid
            db_cleanup = SessionLocal()
            for b_id in created_bid_ids:
                test_bid = db_cleanup.query(Bid).filter(Bid.bid_id == b_id).first()
                if test_bid:
                    db_cleanup.delete(test_bid)
            t_reset = db_cleanup.query(Tender).filter(Tender.tender_id == "GEM/2026/B/892101").first()
            if t_reset:
                t_reset.status = "Active"
                t_reset.awarded_bid_id = None
            db_cleanup.commit()
            db_cleanup.close()
            log("Test cleanup completed: Temporary test bids deleted and tender status restored to Active.")
        except Exception as e:
            log(f"Cleanup warning: {e}")

if __name__ == "__main__":
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    run_tests()

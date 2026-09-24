import io
import json
import requests
from reportlab.pdfgen import canvas

def run_tests():
    # 1. Create a PDF in memory
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer)
    c.drawString(100, 750, 'GeM Technical Bid Dossier')
    c.drawString(100, 730, 'Company: Bharat MicroSystems Pvt Ltd')
    c.drawString(100, 710, 'PAN: AABCB1234K')
    c.drawString(100, 690, 'GSTIN: 07AABCB1234K1Z5')
    c.drawString(100, 670, 'UDYAM-DL-01-0012345')
    c.drawString(100, 650, 'EPFO: DLCPM0012345000')
    c.drawString(100, 630, 'GST applicable on services: 18%')
    c.drawString(100, 610, 'TDS under section 194C: 2%')
    c.drawString(100, 590, 'Make in India local content declaration: 68.5%')
    c.save()
    pdf_buffer.seek(0)
    pdf_bytes = pdf_buffer.read()

    # 2. Get JWT Token
    res = requests.post('http://127.0.0.1:8000/api/auth/token', json={'tender_id': 'GEM/2026/B/892101'})
    assert res.status_code == 200, f"Token failed: {res.text}"
    token = res.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    print("[PASS] POST /api/auth/token passed")

    # 3. Test POST /api/verify
    files = {'file': ('bharat_bid.pdf', io.BytesIO(pdf_bytes), 'application/pdf')}
    verify_res = requests.post('http://127.0.0.1:8000/api/verify', headers=headers, files=files)
    assert verify_res.status_code == 200, f"Verify failed: {verify_res.text}"
    verify_data = verify_res.json()
    
    # Assert exact schema
    for field in ['bid_id', 'compliance_score', 'status', 'risk_level', 'extracted_data', 'deductions']:
        assert field in verify_data, f"Missing field {field} in verify_data"
    for ext_field in ['pan', 'gstin', 'udyam', 'epfo', 'local_content_percent']:
        assert ext_field in verify_data['extracted_data'], f"Missing field {ext_field} in extracted_data"

    assert verify_data['compliance_score'] == 100
    assert verify_data['status'] == 'Qualified'
    assert verify_data['risk_level'] == 'Low'
    assert verify_data['extracted_data']['local_content_percent'] == 68.5
    assert verify_data['extracted_data']['pan'] == 'AABCB1234K'
    assert verify_data['extracted_data']['gstin'] == '07AABCB1234K1Z5'
    print("[PASS] POST /api/verify schema and calculations passed")

    # 4. Test POST /api/bids/submit
    submit_files = {'file': ('bharat_bid.pdf', io.BytesIO(pdf_bytes), 'application/pdf')}
    submit_data = {
        'company_name': 'Bharat MicroSystems Pvt Ltd',
        'quoted_price': '4850000',
        'tender_id': 'GEM/2026/B/892101'
    }
    submit_res = requests.post('http://127.0.0.1:8000/api/bids/submit', headers=headers, files=submit_files, data=submit_data)
    assert submit_res.status_code == 200, f"Submit failed: {submit_res.text}"
    submitted_bid = submit_res.json()
    assert submitted_bid['company_name'] == 'Bharat MicroSystems Pvt Ltd'
    assert submitted_bid['compliance_score'] == 100
    assert submitted_bid['status'] == 'Qualified'
    print(f"[PASS] POST /api/bids/submit passed (bid_id: {submitted_bid['bid_id']})")

    # 5. Test GET /api/bids
    get_bids_res = requests.get('http://127.0.0.1:8000/api/bids')
    assert get_bids_res.status_code == 200, f"Get bids failed: {get_bids_res.text}"
    # 6. Test Negative Compliance Evaluation
    neg_pdf_buffer = io.BytesIO()
    c2 = canvas.Canvas(neg_pdf_buffer)
    c2.drawString(100, 750, 'Non-Compliant Bid Dossier')
    c2.drawString(100, 730, 'Company: Fraudulent Tech Ltd')
    c2.drawString(100, 710, 'PAN: AAACA9999K')
    c2.drawString(100, 690, 'GSTIN: 07AABCB1234K1Z5')
    c2.drawString(100, 670, 'Make in India local content declaration: 25.0%')
    c2.save()
    neg_pdf_buffer.seek(0)

    neg_files = {'file': ('non_compliant.pdf', neg_pdf_buffer, 'application/pdf')}
    neg_res = requests.post('http://127.0.0.1:8000/api/verify', headers=headers, files=neg_files)
    neg_v = neg_res.json()
    assert neg_v['compliance_score'] == 25, f"Expected 25 score, got {neg_v['compliance_score']}"
    assert neg_v['status'] == 'Disqualified'
    assert neg_v['risk_level'] == 'High'
    assert len(neg_v['deductions']) == 3
    print(f"[PASS] Negative evaluation passed (Score: {neg_v['compliance_score']}, Status: {neg_v['status']}, Deductions: {len(neg_v['deductions'])})")

    print("\nALL BACKEND API TESTS COMPLETED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()

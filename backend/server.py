import re
import io
import os
import sys
import json
import time
import hmac
import hashlib
import base64
from pathlib import Path

# Ensure root directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Header, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from sqlalchemy.orm import Session

from backend.database import init_db, get_db, Tender, Bid, Deduction, AuditLog, reset_demo_data
from backend.services.document_ingestion import ingest_document
from backend.services.bid_extractor import extract_bid_dossier
from backend.services.text_normalizer import normalize_text
from backend.ml.ml_adapter import evaluate_bid_ml_compliance

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and perform safe one-time seeding (Task 1 & Task 12)
    init_db()
    yield

app = FastAPI(title="GeM Bid Compliance Engine", lifespan=lifespan)

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET", "bidwise-demo-secret-change-in-production").encode()

# Standardized qualification threshold constants (Task 6)
THRESHOLD_QUALIFIED = 80
THRESHOLD_CLARIFICATION = 60

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def create_jwt(subject: str, role: str = "procurement_officer", ttl_seconds: int = 3600) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": subject, "role": role, "iat": int(time.time()), "exp": int(time.time()) + ttl_seconds}
    encoded_header = _b64url(json.dumps(header, separators=(",", ":")).encode())
    encoded_payload = _b64url(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    signature = hmac.new(JWT_SECRET, signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url(signature)}"

def verify_jwt(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer JWT required")
    token = authorization.split(" ", 1)[1]
    try:
        head, body, sig = token.split(".")
        expected = _b64url(hmac.new(JWT_SECRET, f"{head}.{body}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            raise ValueError("signature")
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
        if payload.get("exp", 0) < time.time():
            raise ValueError("expired")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired JWT")

def parse_bid_pdf(file_bytes):
    """
    Ingests and extracts structured dossier using Phase 3 multi-page
    ingestion and context-aware extractor services.
    """
    if hasattr(file_bytes, "getvalue"):
        raw_bytes = file_bytes.getvalue()
    elif hasattr(file_bytes, "read"):
        raw_bytes = file_bytes.read()
    else:
        raw_bytes = file_bytes

    ingestion = ingest_document(raw_bytes)
    dossier = extract_bid_dossier(ingestion)

    return {
        "raw_text": ingestion["text"],
        "pan": dossier["pan"],
        "gstin": dossier["gstin"],
        "udyam": dossier["udyam"],
        "epfo": dossier["epfo"],
        "local_content": dossier["local_content_percent"],
        "local_content_percent": dossier["local_content_percent"],
        "extraction_method": ingestion["extraction_method"],
        "page_count": ingestion["page_count"],
        "confidence": ingestion["confidence"],
        "turnover": dossier["turnover"],
        "oem": {
            "oem_name": dossier["oem_name"],
            "oem_authorization_valid_until": dossier["oem_authorization_valid_until"]
        },
        "evidence": dossier["evidence"]
    }

def compute_compliance_status(score: int) -> tuple[str, str]:
    if score >= THRESHOLD_QUALIFIED:
        return "Qualified", "Low"
    elif score >= THRESHOLD_CLARIFICATION:
        return "Clarification", "Medium"
    else:
        return "Disqualified", "High"

def evaluate_compliance(data: dict) -> tuple[int, list[dict], str, str]:
    score = 100
    deductions = []

    pan = data.get("pan")
    gstin = data.get("gstin")
    mii = data.get("local_content") if data.get("local_content") is not None else data.get("local_content_percent")
    epfo = data.get("epfo")

    # 1. Statutory Identifiers
    if not pan or not gstin:
        score = 0
        deductions.append({
            "category": "Statutory Identifiers",
            "reason": "Critical statutory identifiers (PAN or GSTIN) missing in document.",
            "score": -100
        })
    else:
        # 2. PAN-GST Cross Consistency
        embedded_pan = gstin[2:12] if len(gstin) >= 12 else ""
        if embedded_pan != pan:
            score -= 40
            deductions.append({
                "category": "Statutory Consistency",
                "reason": f"PAN mismatch: Standalone PAN ({pan}) does not match GSTIN embedded PAN ({embedded_pan}).",
                "score": -40
            })

    # 3. Make in India Local Content Requirement (Min 50%)
    if mii is None:
        score -= 25
        deductions.append({
            "category": "Make in India",
            "reason": "Make in India local content declaration not identified in dossier (Mandatory >=50% Class-I cutoff).",
            "score": -25
        })
    elif mii < 50.0:
        score -= 45
        deductions.append({
            "category": "Make in India",
            "reason": f"Make in India local content ({mii}%) is below mandatory 50% Class-I cutoff.",
            "score": -45
        })

    # 4. EPFO Registration
    if not epfo:
        score -= 15
        deductions.append({
            "category": "Labor & Social Security",
            "reason": "EPFO registration code missing in dossier.",
            "score": -15
        })

    score = max(0, score)
    status, risk_level = compute_compliance_status(score)
    return score, deductions, status, risk_level

def format_bid_payload(bid: Bid) -> dict:
    """Formats a Bid database model into the unified Phase 1/Phase 2/Phase 3/ML JSON schema."""
    evidence_dict = {}
    if getattr(bid, "evidence_json", None):
        try:
            evidence_dict = json.loads(bid.evidence_json)
        except Exception:
            evidence_dict = {}

    probabilities_dict = {}
    if getattr(bid, "ml_probabilities_json", None):
        try:
            probabilities_dict = json.loads(bid.ml_probabilities_json)
        except Exception:
            probabilities_dict = {}

    model_breakdown_dict = {}
    if getattr(bid, "ml_model_breakdown_json", None):
        try:
            model_breakdown_dict = json.loads(bid.ml_model_breakdown_json)
        except Exception:
            model_breakdown_dict = {}

    provenance_dict = {}
    if getattr(bid, "ml_feature_provenance_json", None):
        try:
            provenance_dict = json.loads(bid.ml_feature_provenance_json)
        except Exception:
            provenance_dict = {}

    ml_prediction = None
    if getattr(bid, "ml_predicted_label", None):
        ml_prediction = {
            "predicted_compliance_label": bid.ml_predicted_label,
            "confidence": bid.ml_confidence,
            "compliance_risk_score": bid.ml_risk_score,
            "risk_level": bid.ml_risk_level,
            "probabilities": probabilities_dict,
            "individual_model_probabilities": model_breakdown_dict,
            "fusion_weights": {
                "logistic_regression": 0.52,
                "lightgbm": 0.48
            },
            "decision_support_summary": (
                f"AI Decision Support: Flagged as '{bid.ml_predicted_label}' "
                f"(Confidence: {(bid.ml_confidence or 0)*100:.1f}%, Risk Score: {bid.ml_risk_score}/100). "
                f"Final procurement qualification rests with the Officer."
            )
        }

    return {
        "id": bid.bid_id,
        "bid_id": bid.bid_id,
        "name": bid.bidder_name,
        "company_name": bid.bidder_name,
        "legal_name": bid.legal_name or bid.bidder_name,
        "quoted_price": bid.quote_amount,
        "quote_amount": bid.quote_amount,
        "tender_id": bid.tender_id,
        "compliance_score": bid.compliance_score,
        "status": bid.status,
        "risk_level": bid.risk_level,
        "officer_remark": bid.officer_remark,
        "submitted_at": bid.submitted_at,
        "document_name": bid.document_name,
        "extraction_method": getattr(bid, "extraction_method", "pdf_text") or "pdf_text",
        "page_count": getattr(bid, "page_count", 1) or 1,
        "ml_prediction": ml_prediction,
        "ml_status": getattr(bid, "ml_status", "available") or "available",
        "feature_provenance": provenance_dict,
        "extracted_data": {
            "pan": bid.pan,
            "gstin": bid.gstin,
            "udyam": bid.udyam,
            "epfo": bid.epfo,
            "local_content_percent": bid.local_content_percent
        },
        "extractedJson": {
            "pan": bid.pan,
            "gstin": bid.gstin,
            "udyam": bid.udyam,
            "epfo": bid.epfo,
            "local_content_percent": bid.local_content_percent
        },
        "evidence": evidence_dict,
        "deductions": [
            {
                "category": d.category,
                "reason": d.reason,
                "score": d.score
            }
            for d in (bid.deductions or [])
        ]
    }


# -------------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------------

class StatusUpdateRequest(BaseModel):
    status: str
    officer_remark: str | None = None

class AwardRequest(BaseModel):
    bid_id: str


# -------------------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------------------

@app.post("/api/auth/token")
async def issue_tender_token(payload: dict):
    tender_id = str(payload.get("tender_id", "GEM/2026/B/892101")).strip()
    role = str(payload.get("role", "procurement_officer"))
    return {"token": create_jwt(tender_id, role), "token_type": "Bearer", "subject": tender_id, "expires_in": 3600}


@app.get("/api/bids")
async def get_bids(db: Session = Depends(get_db)):
    """Reads all persisted bids from SQLite, newest submissions first (Task 4)."""
    bids = db.query(Bid).order_by(Bid.id.desc()).all()
    return [format_bid_payload(b) for b in bids]


@app.get("/api/bids/{bid_id}")
async def get_bid_detail(bid_id: str, db: Session = Depends(get_db)):
    """Returns detailed bid info, extracted data, deductions, and audit history (Task 5)."""
    bid = db.query(Bid).filter(Bid.bid_id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail=f"Bid '{bid_id}' not found")

    payload = format_bid_payload(bid)
    payload["audit_history"] = [
        {
            "action": a.action,
            "old_status": a.old_status,
            "new_status": a.new_status,
            "officer_remark": a.officer_remark,
            "timestamp": a.timestamp,
        }
        for a in bid.audit_logs
    ]
    payload["auditHistory"] = payload["audit_history"]
    return payload


@app.post("/api/bids/submit")
async def submit_bid(
    company_name: str = Form(...),
    quoted_price: float = Form(...),
    tender_id: str = Form(...),
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    CANONICAL PERSISTENT BID SUBMISSION & VERIFICATION WORKFLOW:
    Processes uploaded PDF dossier, extracts statutory criteria, runs 21-feature ML evaluation,
    applies statutory business rules, persists the Bid record, Deductions, and AuditLog to SQLite,
    and returns the complete unified bid assessment payload for live Overview and L1 evaluation.
    """
    claims = verify_jwt(authorization)
    if claims.get("sub") != tender_id:
        raise HTTPException(status_code=403, detail="JWT subject does not match tender")
    if quoted_price <= 0:
        raise HTTPException(status_code=400, detail="Quoted price must be positive")

    contents = await file.read()
    data = parse_bid_pdf(contents)
    score, deductions, status, risk_level = evaluate_compliance(data)
    bid_id = f"BID-{int(time.time() * 1000) % 100000:05d}"
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # ML Compliance Evaluation (Step 5, Step 6)
    ml_eval = evaluate_bid_ml_compliance(
        dossier=data,
        rule_score=score,
        deductions=deductions,
        submission_context={
            "company_name": company_name,
            "quote_amount": quoted_price,
            "tender_id": tender_id
        }
    )
    ml_pred = ml_eval.get("ml_prediction") or {}

    # 1. Create Bid record
    bid = Bid(
        bid_id=bid_id,
        tender_id=tender_id,
        bidder_name=company_name,
        legal_name=company_name,
        quote_amount=quoted_price,
        compliance_score=score,
        status=status,
        risk_level=risk_level,
        pan=data["pan"],
        gstin=data["gstin"],
        udyam=data["udyam"],
        epfo=data["epfo"],
        local_content_percent=data["local_content_percent"],
        submitted_at=now_iso,
        document_name=file.filename,
        officer_remark=None,
        extraction_method=data.get("extraction_method", "pdf_text"),
        page_count=data.get("page_count", 1),
        evidence_json=json.dumps(data.get("evidence", {})),
        ml_predicted_label=ml_pred.get("predicted_compliance_label"),
        ml_confidence=ml_pred.get("confidence"),
        ml_risk_score=ml_pred.get("compliance_risk_score"),
        ml_risk_level=ml_pred.get("risk_level"),
        ml_probabilities_json=json.dumps(ml_pred.get("probabilities", {})) if ml_pred else None,
        ml_model_breakdown_json=json.dumps(ml_pred.get("individual_model_probabilities", {})) if ml_pred else None,
        ml_feature_provenance_json=json.dumps(ml_eval.get("feature_provenance", {})),
        ml_status=ml_eval.get("ml_status", "available")
    )
    db.add(bid)
    db.flush()

    # 2. Create Deduction records
    for d in deductions:
        deduction = Deduction(
            bid_id=bid_id,
            category=d["category"],
            reason=d["reason"],
            score=d["score"]
        )
        db.add(deduction)

    # 3. Create initial AuditLog record
    audit = AuditLog(
        bid_id=bid_id,
        action="AI Verification",
        old_status=None,
        new_status=status,
        officer_remark=f"Technical bid dossier ingested via {data.get('extraction_method', 'pdf_text')} ({data.get('page_count', 1)} page(s)). ML Assessment: {ml_pred.get('predicted_compliance_label', 'Evaluated')} (Risk Score: {ml_pred.get('compliance_risk_score', 'N/A')}).",
        timestamp=now_iso
    )
    db.add(audit)

    db.commit()
    db.refresh(bid)

    return format_bid_payload(bid)


@app.post("/api/verify")
async def verify_bid(file: UploadFile = File(...), authorization: str | None = Header(default=None)):
    """
    STATELESS VERIFICATION PREVIEW / DRY-RUN ENDPOINT:
    Analyzes and previews extracted document criteria and ML risk assessment without creating
    a persistent SQLite bid record. For official persistent bid submission, use POST /api/bids/submit.
    """
    verify_jwt(authorization)
    contents = await file.read()
    data = parse_bid_pdf(contents)
    score, deductions, status, risk_level = evaluate_compliance(data)
    bid_id = f"BID-{int(time.time() * 1000) % 100000:05d}"

    # ML Compliance Evaluation (Step 5, Step 6, Step 7)
    ml_eval = evaluate_bid_ml_compliance(
        dossier=data,
        rule_score=score,
        deductions=deductions
    )

    return {
        "id": bid_id,
        "bid_id": bid_id,
        "compliance_score": score,
        "status": status,
        "risk_level": risk_level,
        "ml_prediction": ml_eval.get("ml_prediction"),
        "ml_status": ml_eval.get("ml_status", "available"),
        "feature_provenance": ml_eval.get("feature_provenance", {}),
        "extraction_method": data.get("extraction_method", "pdf_text"),
        "page_count": data.get("page_count", 1),
        "confidence": data.get("confidence", 0.95),
        "extracted_data": {
            "pan": data["pan"],
            "gstin": data["gstin"],
            "udyam": data["udyam"],
            "epfo": data["epfo"],
            "local_content_percent": data["local_content_percent"]
        },
        "deductions": deductions,
        "turnover": data.get("turnover"),
        "oem": data.get("oem"),
        "evidence": data.get("evidence", {})
    }


@app.patch("/api/bids/{bid_id}/status")
async def update_bid_status(
    bid_id: str, 
    payload: StatusUpdateRequest, 
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    """Updates manual officer decision and creates auditable log record (Task 6)."""
    verify_jwt(authorization)
    bid = db.query(Bid).filter(Bid.bid_id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail=f"Bid '{bid_id}' not found")

    new_status = payload.status.strip()
    valid_statuses = ["Qualified", "Clarification", "Disqualified"]
    if new_status not in valid_statuses:
        # Match case-insensitively if needed
        matched = next((s for s in valid_statuses if s.lower() == new_status.lower()), None)
        if not matched:
            raise HTTPException(status_code=400, detail=f"Invalid status '{new_status}'. Allowed: {valid_statuses}")
        new_status = matched

    old_status = bid.status
    bid.status = new_status
    if payload.officer_remark is not None:
        bid.officer_remark = payload.officer_remark.strip()

    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # Create auditable log record
    audit_entry = AuditLog(
        bid_id=bid.bid_id,
        action="Officer Decision",
        old_status=old_status,
        new_status=new_status,
        officer_remark=payload.officer_remark or "Status updated by procurement officer.",
        timestamp=now_iso
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(bid)

    return format_bid_payload(bid)


@app.get("/api/bids/{bid_id}/audit")
async def get_bid_audit_logs(bid_id: str, db: Session = Depends(get_db)):
    """Returns chronological audit history for a bid (Task 7)."""
    bid = db.query(Bid).filter(Bid.bid_id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail=f"Bid '{bid_id}' not found")

    logs = db.query(AuditLog).filter(AuditLog.bid_id == bid_id).order_by(AuditLog.id.asc()).all()
    return [
        {
            "action": l.action,
            "old_status": l.old_status,
            "new_status": l.new_status,
            "officer_remark": l.officer_remark,
            "timestamp": l.timestamp
        }
        for l in logs
    ]


@app.post("/api/tenders/{tender_id:path}/award")
async def award_tender(
    tender_id: str, 
    payload: AwardRequest, 
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    Ratifies official L1 award and freezes tender evaluation (Task 10).
    Enforces strict procurement rules:
    1. Selected bid must be Qualified.
    2. Selected bid must be the lowest priced compliant offer (L1).
    3. Tender must not already be awarded or frozen.
    """
    claims = verify_jwt(authorization)
    if claims.get("sub") != tender_id:
        raise HTTPException(status_code=403, detail="JWT subject does not match tender")

    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail=f"Tender '{tender_id}' not found")

    if tender.status in ["Awarded", "Frozen"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Tender '{tender_id}' is already awarded to bid '{tender.awarded_bid_id}' and evaluation is frozen."
        )

    selected_bid = db.query(Bid).filter(Bid.bid_id == payload.bid_id, Bid.tender_id == tender_id).first()
    if not selected_bid:
        raise HTTPException(status_code=404, detail=f"Bid '{payload.bid_id}' not found under tender '{tender_id}'")

    if selected_bid.status.upper() != "QUALIFIED":
        raise HTTPException(
            status_code=400, 
            detail=f"Selected bid '{payload.bid_id}' has status '{selected_bid.status}' and is not eligible for award. Only Qualified bids can be awarded."
        )

    # Check for lowest compliant price among qualified bids
    qualified_bids = db.query(Bid).filter(Bid.tender_id == tender_id, Bid.status == "Qualified").all()
    if qualified_bids:
        lowest_quote = min(b.quote_amount for b in qualified_bids)
        if selected_bid.quote_amount > lowest_quote:
            raise HTTPException(
                status_code=400,
                detail=f"Selected bid '{payload.bid_id}' quoted ₹{selected_bid.quote_amount:,.0f}, but a lower-priced compliant bid exists (L1: ₹{lowest_quote:,.0f}). Only the true lowest compliant offer can be awarded."
            )

    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # Mark tender awarded & frozen
    tender.status = "Awarded"
    tender.awarded_bid_id = selected_bid.bid_id

    # Create award audit log
    award_audit = AuditLog(
        bid_id=selected_bid.bid_id,
        action="Tender Award Ratified",
        old_status=selected_bid.status,
        new_status="Awarded (L1)",
        officer_remark=f"Official L1 procurement award ratified under GeM tender {tender_id}.",
        timestamp=now_iso
    )
    db.add(award_audit)
    db.commit()

    return {
        "success": True,
        "tender_id": tender_id,
        "awarded_bid_id": selected_bid.bid_id,
        "status": "Awarded"
    }


@app.post("/api/demo/reset")
async def api_reset_demo():
    """Reset the database: clears bids and related records, preserves active tender, leaving bidder table empty."""
    try:
        res = reset_demo_data()
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/bids/{bid_id}")
async def delete_bid(
    bid_id: str, 
    authorization: str | None = Header(default=None), 
    db: Session = Depends(get_db)
):
    """Deletes a test bid submission to prevent test suite pollution."""
    bid = db.query(Bid).filter(Bid.bid_id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail=f"Bid '{bid_id}' not found")
    db.delete(bid)
    db.commit()
    return {"success": True, "deleted_bid_id": bid_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
import os
import time
from pathlib import Path
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, ForeignKey, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "geprocurement.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------------------------------
# Database Models
# -------------------------------------------------------------------------

class Tender(Base):
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tender_id = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    estimated_budget = Column(Float, default=0.0)
    created_at = Column(String(64), nullable=False)
    status = Column(String(32), default="Active")  # Active, Awarded, Frozen
    awarded_bid_id = Column(String(64), nullable=True)

    bids = relationship("Bid", back_populates="tender", cascade="all, delete-orphan")


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bid_id = Column(String(64), unique=True, index=True, nullable=False)
    tender_id = Column(String(64), ForeignKey("tenders.tender_id"), index=True, nullable=False)
    bidder_name = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=True)
    quote_amount = Column(Float, nullable=False)
    compliance_score = Column(Integer, nullable=False)
    status = Column(String(32), nullable=False)  # Qualified, Clarification, Disqualified
    risk_level = Column(String(32), nullable=False)  # Low, Medium, High
    pan = Column(String(16), nullable=True)
    gstin = Column(String(20), nullable=True)
    udyam = Column(String(32), nullable=True)
    epfo = Column(String(32), nullable=True)
    local_content_percent = Column(Float, nullable=True)
    submitted_at = Column(String(64), nullable=False)
    document_name = Column(String(255), nullable=True)
    officer_remark = Column(Text, nullable=True)
    extraction_method = Column(String(32), default="pdf_text")
    page_count = Column(Integer, default=1)
    evidence_json = Column(Text, nullable=True)

    # ML Model Risk Assessment and Provenance Fields (Step 8)
    ml_predicted_label = Column(String(64), nullable=True)
    ml_confidence = Column(Float, nullable=True)
    ml_risk_score = Column(Float, nullable=True)
    ml_risk_level = Column(String(32), nullable=True)
    ml_probabilities_json = Column(Text, nullable=True)
    ml_model_breakdown_json = Column(Text, nullable=True)
    ml_feature_provenance_json = Column(Text, nullable=True)
    ml_status = Column(String(32), default="available")

    tender = relationship("Tender", back_populates="bids")
    deductions = relationship("Deduction", back_populates="bid", cascade="all, delete-orphan", lazy="joined")
    audit_logs = relationship("AuditLog", back_populates="bid", cascade="all, delete-orphan", order_by="AuditLog.id.asc()")


class Deduction(Base):
    __tablename__ = "deductions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bid_id = Column(String(64), ForeignKey("bids.bid_id", ondelete="CASCADE"), index=True, nullable=False)
    category = Column(String(128), nullable=False)
    reason = Column(Text, nullable=False)
    score = Column(Integer, nullable=False)

    bid = relationship("Bid", back_populates="deductions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bid_id = Column(String(64), ForeignKey("bids.bid_id", ondelete="CASCADE"), index=True, nullable=False)
    action = Column(String(128), nullable=False)
    old_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=True)
    officer_remark = Column(Text, nullable=True)
    timestamp = Column(String(64), nullable=False)

    bid = relationship("Bid", back_populates="audit_logs")


# -------------------------------------------------------------------------
# One-time Safe Seeding Mechanism (Task 12)
# -------------------------------------------------------------------------

SEED_BIDDERS = [
    {
        "bid_id": "BID-8921-01",
        "bidder_name": "NexaTech Computations Pvt Ltd",
        "legal_name": "NexaTech Computations India Private Limited",
        "quote_amount": 5240000.0,
        "compliance_score": 96,
        "status": "Qualified",
        "risk_level": "Low",
        "pan": "AABCN4920K",
        "gstin": "07AABCN4920K1Z8",
        "udyam": "UDYAM-DL-01-0089241",
        "epfo": "DLCPM0019284000",
        "local_content_percent": 68.4,
        "document_name": "Dossier_NexaTech_GEM8921_TechBid_Signed.pdf",
        "officer_remark": "All statutory GST, PAN, and MII declarations cross-verified with MCA21 & GeM API. Passed technical evaluation.",
        "deductions": []
    },
    {
        "bid_id": "BID-8921-02",
        "bidder_name": "Apex CyberSystems India",
        "legal_name": "Apex CyberSystems & Infra Solutions Ltd",
        "quote_amount": 4980000.0,
        "compliance_score": 94,
        "status": "Qualified",
        "risk_level": "Low",
        "pan": "AAACA5812B",
        "gstin": "27AAACA5812B1ZX",
        "udyam": "UDYAM-MH-03-0044192",
        "epfo": "MHBAN0028491000",
        "local_content_percent": 62.0,
        "document_name": "Dossier_ApexCyber_Technical_2026.pdf",
        "officer_remark": "Lowest compliant quotation verified with Class-I Make in India certificate.",
        "deductions": []
    },
    {
        "bid_id": "BID-8921-03",
        "bidder_name": "Falcon Infotech LLP",
        "legal_name": "Falcon Infotech Logistics & Solutions LLP",
        "quote_amount": 4450000.0,
        "compliance_score": 24,
        "status": "Disqualified",
        "risk_level": "High",
        "pan": "AAACF1294K",
        "gstin": "07AABCF9876E1Z5",
        "udyam": "UDYAM-DL-02-0099182",
        "epfo": None,
        "local_content_percent": 54.0,
        "document_name": "Dossier_Falcon_TechBid_GEM_Suspicious.pdf",
        "officer_remark": "Critical mismatch: Bidder PAN does not match GSTIN digits 3 to 12. GST portal shows suspended registration.",
        "deductions": [
            {
                "category": "Statutory Consistency",
                "reason": "PAN mismatch: Standalone PAN (AAACF1294K) does not match GSTIN embedded PAN (AABCF9876E).",
                "score": -40
            },
            {
                "category": "Labor & Social Security",
                "reason": "EPFO registration code missing in dossier.",
                "score": -15
            }
        ]
    },
    {
        "bid_id": "BID-8921-04",
        "bidder_name": "Global Tech Imports Ltd",
        "legal_name": "Global Tech & Electronics Imports Limited",
        "quote_amount": 4720000.0,
        "compliance_score": 42,
        "status": "Disqualified",
        "risk_level": "High",
        "pan": "AAACG4410R",
        "gstin": "29AAACG4410R1Z2",
        "udyam": "UDYAM-KR-03-0012984",
        "epfo": "KRPUN0091823000",
        "local_content_percent": 26.0,
        "document_name": "Dossier_GlobalTech_DirectImport_Specs.pdf",
        "officer_remark": "Failed mandatory Class-I Make in India threshold (Achieved 26% vs required >=50%). Tender reserved for Class-I suppliers.",
        "deductions": [
            {
                "category": "Make in India",
                "reason": "Make in India local content (26.0%) is below minimum 50% cutoff.",
                "score": -20
            }
        ]
    },
    {
        "bid_id": "BID-8921-05",
        "bidder_name": "Vanguard IT Solutions",
        "legal_name": "Vanguard IT & Networking Solutions Pvt Ltd",
        "quote_amount": 5120000.0,
        "compliance_score": 91,
        "status": "Qualified",
        "risk_level": "Low",
        "pan": "AABCV7788P",
        "gstin": "33AABCV7788P1Z9",
        "udyam": "UDYAM-TN-01-0077123",
        "epfo": "TNMAS0044192000",
        "local_content_percent": 58.0,
        "document_name": "Dossier_VanguardIT_Complete_Tech.pdf",
        "officer_remark": "Technically qualified. MII and financial audits verified.",
        "deductions": []
    },
    {
        "bid_id": "BID-8921-06",
        "bidder_name": "Sahyadri Infotech Hub",
        "legal_name": "Sahyadri Infotech Hub Private Limited",
        "quote_amount": 5390000.0,
        "compliance_score": 88,
        "status": "Qualified",
        "risk_level": "Low",
        "pan": "AABCS3311E",
        "gstin": "27AABCS3311E1Z3",
        "udyam": "UDYAM-MH-19-0091238",
        "epfo": "MHBAN0091238000",
        "local_content_percent": 52.0,
        "document_name": "Dossier_Sahyadri_Hardware.pdf",
        "officer_remark": "Qualified with minor note on past experience timelines.",
        "deductions": []
    },
    {
        "bid_id": "BID-8921-07",
        "bidder_name": "Paramount Data Systems",
        "legal_name": "Paramount Data & Computing Services Ltd",
        "quote_amount": 5480000.0,
        "compliance_score": 92,
        "status": "Qualified",
        "risk_level": "Low",
        "pan": "AAACP9901M",
        "gstin": "06AAACP9901M1Z1",
        "udyam": "UDYAM-HR-04-0019284",
        "epfo": "HRPUN0019284000",
        "local_content_percent": 65.0,
        "document_name": "Dossier_Paramount_Dossier_Verified.pdf",
        "officer_remark": "Strong compliance score, all documents verified.",
        "deductions": []
    },
    {
        "bid_id": "BID-8921-08",
        "bidder_name": "Zenith Digital Infra",
        "legal_name": "Zenith Digital Infrastructure LLP",
        "quote_amount": 5590000.0,
        "compliance_score": 89,
        "status": "Qualified",
        "risk_level": "Low",
        "pan": "AAACZ6671N",
        "gstin": "24AAACZ6671N1ZA",
        "udyam": "UDYAM-GJ-01-0066120",
        "epfo": "GJAHM0066120000",
        "local_content_percent": 60.0,
        "document_name": "Dossier_Zenith_Infrastructure.pdf",
        "officer_remark": "Fully verified.",
        "deductions": []
    },
    {
        "bid_id": "BID-8921-09",
        "bidder_name": "Krystal Byte Informatics",
        "legal_name": "Krystal Byte Informatics Private Limited",
        "quote_amount": 5650000.0,
        "compliance_score": 87,
        "status": "Qualified",
        "risk_level": "Low",
        "pan": "AABCK4829T",
        "gstin": "36AABCK4829T1ZY",
        "udyam": "UDYAM-TS-09-0012399",
        "epfo": "TSHYD0012399000",
        "local_content_percent": 55.0,
        "document_name": "Dossier_KrystalByte_Specs.pdf",
        "officer_remark": "Compliant in all respects.",
        "deductions": []
    },
    {
        "bid_id": "BID-8921-10",
        "bidder_name": "CyberShield Technologies",
        "legal_name": "CyberShield Security & Technologies Ltd",
        "quote_amount": 5720000.0,
        "compliance_score": 95,
        "status": "Qualified",
        "risk_level": "Low",
        "pan": "AAACC1120Q",
        "gstin": "07AAACC1120Q1Z4",
        "udyam": "UDYAM-DL-03-0044129",
        "epfo": "DLCPM0044129000",
        "local_content_percent": 70.0,
        "document_name": "Dossier_CyberShield_Tech.pdf",
        "officer_remark": "All statutory checks green.",
        "deductions": []
    },
    {
        "bid_id": "BID-8921-11",
        "bidder_name": "BlueStar Hardware & Systems",
        "legal_name": "BlueStar Hardware & Systems LLP",
        "quote_amount": 4890000.0,
        "compliance_score": 78,
        "status": "Clarification",
        "risk_level": "Medium",
        "pan": "AAACB9921D",
        "gstin": "19AAACB9921D1ZB",
        "udyam": "UDYAM-WB-10-0081249",
        "epfo": "WBKOL0081249000",
        "local_content_percent": 51.0,
        "document_name": "Dossier_BlueStar_Hardware.pdf",
        "officer_remark": "OEM endorsement validity clarification pending under GeM Rule 173.",
        "deductions": []
    },
    {
        "bid_id": "BID-8921-12",
        "bidder_name": "QuickSilver Network Solutions",
        "legal_name": "QuickSilver Network Solutions India Pvt Ltd",
        "quote_amount": 5850000.0,
        "compliance_score": 35,
        "status": "Disqualified",
        "risk_level": "High",
        "pan": "AABCQ8811K",
        "gstin": "32AABCQ8811K1Z2",
        "udyam": "UDYAM-KL-07-0099441",
        "epfo": "KLTVM0099441000",
        "local_content_percent": 18.0,
        "document_name": "Dossier_QuickSilver_Network.pdf",
        "officer_remark": "Non-Local Supplier (<20% Make in India). Direct violation of Class-I procurement mandate.",
        "deductions": [
            {
                "category": "Make in India",
                "reason": "Declared local content is only 18.0%, failing mandatory 50% cutoff.",
                "score": -20
            }
        ]
    }
]

def reset_demo_data():
    """Wipes all bids, deductions, and audit logs while preserving and resetting the active tender."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Reset or Create canonical active tender
        tender = db.query(Tender).filter(Tender.tender_id == "GEM/2026/B/892101").first()
        if not tender:
            tender = Tender(
                tender_id="GEM/2026/B/892101",
                title="Supply, Configuration & 3-Yr Support of 500 Enterprise Laptops",
                organization="Ministry of Electronics & Information Technology (MeitY)",
                estimated_budget=60000000.0,
                created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                status="Active",
                awarded_bid_id=None
            )
            db.add(tender)
        else:
            tender.status = "Active"
            tender.awarded_bid_id = None
            tender.title = "Supply, Configuration & 3-Yr Support of 500 Enterprise Laptops"
            tender.organization = "Ministry of Electronics & Information Technology (MeitY)"
            tender.estimated_budget = 60000000.0
        
        db.commit()

        # 2. Delete all existing deductions, audit logs, and bids
        db.query(Deduction).delete()
        db.query(AuditLog).delete()
        db.query(Bid).delete()
        db.commit()

        return {"status": "success", "message": "Successfully reset database: bids cleared and active tender preserved with 0 bidders."}
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def seed_canonical_bidders():
    """Explicitly seeds the 12 canonical demo bidders (optional manual utility, never called automatically)."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Reset or Create canonical active tender
        tender = db.query(Tender).filter(Tender.tender_id == "GEM/2026/B/892101").first()
        if not tender:
            tender = Tender(
                tender_id="GEM/2026/B/892101",
                title="Supply, Configuration & 3-Yr Support of 500 Enterprise Laptops",
                organization="Ministry of Electronics & Information Technology (MeitY)",
                estimated_budget=60000000.0,
                created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                status="Active",
                awarded_bid_id=None
            )
            db.add(tender)
        else:
            tender.status = "Active"
            tender.awarded_bid_id = None
        db.commit()

        # 2. Delete all existing deductions, audit logs, and bids
        db.query(Deduction).delete()
        db.query(AuditLog).delete()
        db.query(Bid).delete()
        db.commit()

        # 3. Seed exactly 12 canonical bidders with ML predictions
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        import json
        from backend.ml.ml_adapter import evaluate_bid_ml_compliance

        for item in SEED_BIDDERS:
            dossier_data = {
                "pan": item["pan"],
                "gstin": item["gstin"],
                "udyam": item["udyam"],
                "epfo": item["epfo"],
                "local_content_percent": item["local_content_percent"],
                "turnover": {"average": "18.4 Cr" if item["compliance_score"] >= 80 else "2.5 Cr"},
                "oem": {"oem_name": "Verified OEM" if item["compliance_score"] >= 80 else None},
                "extraction_method": "pdf_text"
            }
            submission_ctx = {
                "company_name": item["bidder_name"],
                "quote_amount": item["quote_amount"],
                "tender_id": "GEM/2026/B/892101",
                "experience_years": 6.0 if item["compliance_score"] >= 80 else 2.0
            }
            deductions_list = item["deductions"]

            ml_res = evaluate_bid_ml_compliance(
                dossier_data,
                rule_score=item["compliance_score"],
                deductions=deductions_list,
                submission_context=submission_ctx
            )
            ml_pred = ml_res.get("ml_prediction") or {}

            bid = Bid(
                bid_id=item["bid_id"],
                tender_id="GEM/2026/B/892101",
                bidder_name=item["bidder_name"],
                legal_name=item["legal_name"],
                quote_amount=item["quote_amount"],
                compliance_score=item["compliance_score"],
                status=item["status"],
                risk_level=item["risk_level"],
                pan=item["pan"],
                gstin=item["gstin"],
                udyam=item["udyam"],
                epfo=item["epfo"],
                local_content_percent=item["local_content_percent"],
                submitted_at=now_iso,
                document_name=item["document_name"],
                officer_remark=item["officer_remark"],
                extraction_method="pdf_text",
                page_count=1,
                ml_predicted_label=ml_pred.get("predicted_compliance_label"),
                ml_confidence=ml_pred.get("confidence"),
                ml_risk_score=ml_pred.get("compliance_risk_score"),
                ml_risk_level=ml_pred.get("risk_level"),
                ml_probabilities_json=json.dumps(ml_pred.get("probabilities", {})) if ml_pred else None,
                ml_model_breakdown_json=json.dumps(ml_pred.get("individual_model_probabilities", {})) if ml_pred else None,
                ml_feature_provenance_json=json.dumps(ml_res.get("feature_provenance", {})),
                ml_status=ml_res.get("ml_status", "available")
            )
            db.add(bid)
            db.flush()

            for d in item["deductions"]:
                deduction = Deduction(
                    bid_id=bid.bid_id,
                    category=d["category"],
                    reason=d["reason"],
                    score=d["score"]
                )
                db.add(deduction)

            initial_audit = AuditLog(
                bid_id=bid.bid_id,
                action="AI Verification",
                old_status=None,
                new_status=item["status"],
                officer_remark="Initial AI pre-qualification and ML risk scoring completed.",
                timestamp=now_iso
            )
            db.add(initial_audit)

        db.commit()
        return {"status": "success", "message": f"Successfully seeded {len(SEED_BIDDERS)} demo bidders."}
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def init_db():
    """Initializes SQLite tables and active tender record without automatic bidder seeding."""
    Base.metadata.create_all(bind=engine)

    # Safe lightweight schema migration for existing SQLite database
    with engine.connect() as conn:
        for col_name, col_type in [
            ("extraction_method", "VARCHAR(32) DEFAULT 'pdf_text'"),
            ("page_count", "INTEGER DEFAULT 1"),
            ("evidence_json", "TEXT NULL"),
            ("ml_predicted_label", "VARCHAR(64) NULL"),
            ("ml_confidence", "FLOAT NULL"),
            ("ml_risk_score", "FLOAT NULL"),
            ("ml_risk_level", "VARCHAR(32) NULL"),
            ("ml_probabilities_json", "TEXT NULL"),
            ("ml_model_breakdown_json", "TEXT NULL"),
            ("ml_feature_provenance_json", "TEXT NULL"),
            ("ml_status", "VARCHAR(32) DEFAULT 'available'")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE bids ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                pass  # Column already exists

    db = SessionLocal()
    try:
        # 1. Tender initialization
        tender = db.query(Tender).filter(Tender.tender_id == "GEM/2026/B/892101").first()
        if not tender:
            tender = Tender(
                tender_id="GEM/2026/B/892101",
                title="Supply, Configuration & 3-Yr Support of 500 Enterprise Laptops",
                organization="Ministry of Electronics & Information Technology (MeitY)",
                estimated_budget=60000000.0,
                created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                status="Active"
            )
            db.add(tender)
            db.commit()

        # No automatic bidder seeding here - starts with zero bids.
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if "--seed" in sys.argv or "seed" in sys.argv:
        print("[DATABASE] Explicitly seeding demo dataset with 12 canonical bidders...")
        res = seed_canonical_bidders()
        print(f"[DATABASE] {res['message']}")
    elif "--reset" in sys.argv or "reset" in sys.argv:
        print("[DATABASE] Resetting database (clearing bids, preserving active tender)...")
        res = reset_demo_data()
        print(f"[DATABASE] {res['message']}")
    else:
        init_db()
        print("[DATABASE] Initialized successfully with 0 pre-seeded bidders.")


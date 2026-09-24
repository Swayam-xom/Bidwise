"""
Unit tests for backend/ml/ml_adapter.py and backend/ml/inference.py.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.ml.ml_adapter import map_features_with_provenance, evaluate_bid_ml_compliance, ORDERED_ML_FEATURES

def test_ml_integration():
    print("[TEST ML] Running ML integration tests...")

    # Sample Compliant Dossier
    compliant_dossier = {
        "pan": "AABCN4920K",
        "gstin": "07AABCN4920K1Z8",
        "udyam": "UDYAM-DL-01-0089241",
        "epfo": "DLCPM0019284000",
        "local_content_percent": 72.0,
        "turnover": {"fy_2024_25": "18.5 Crore", "average": "18.5 Crore"},
        "oem": {"oem_name": "Bharat Micro Systems", "oem_authorization_valid_until": "31/12/2027"},
        "extraction_method": "pdf_text",
        "evidence": {}
    }
    submission_ctx = {
        "company_name": "NexaTech Computations Pvt Ltd",
        "quoted_price": 5240000.0,
        "experience_years": 6.0
    }

    features, provenance = map_features_with_provenance(compliant_dossier, rule_score=96, deductions=[], submission_context=submission_ctx)

    assert len(features) == 21, f"Expected 21 features, got {len(features)}"
    assert list(features.keys()) == ORDERED_ML_FEATURES, "Feature keys do not match ORDERED_ML_FEATURES"
    assert len(provenance) == 21, f"Expected 21 provenance records, got {len(provenance)}"

    print("Checking provenance structure:")
    for k, v in provenance.items():
        assert "value" in v and "source" in v, f"Invalid provenance format for {k}"
        assert v["source"] in ["DOCUMENT", "DERIVED", "PLATFORM", "MOCK_EXTERNAL", "UNAVAILABLE"], f"Invalid source {v['source']}"
    print("[PASS] 21 features and provenance schema verified.")

    # Run ML prediction
    res = evaluate_bid_ml_compliance(compliant_dossier, rule_score=96, deductions=[], submission_context=submission_ctx)
    assert res["ml_status"] == "available", f"ML prediction failed: {res.get('ml_error')}"
    pred = res["ml_prediction"]
    assert pred is not None
    print("\nCompliant Prediction Result:")
    print("  Label:", pred["predicted_compliance_label"])
    print("  Confidence:", pred["confidence"])
    print("  Risk Score:", pred["compliance_risk_score"])
    print("  Risk Level:", pred["risk_level"])
    print("  Probabilities:", pred["probabilities"])
    print("  Model breakdown:", pred["individual_model_probabilities"])
    print("  Fusion weights:", pred["fusion_weights"])

    assert pred["predicted_compliance_label"] in ["Compliant", "Needs Review", "Non-Compliant"]
    assert 0.0 <= pred["confidence"] <= 1.0
    assert 0.0 <= pred["compliance_risk_score"] <= 100.0
    assert pred["risk_level"] in ["LOW", "MEDIUM", "HIGH"]

    # Sample High-Risk Mismatch Dossier
    mismatch_dossier = {
        "pan": "AAACF1294K",
        "gstin": "07AABCF9876E1Z5", # embedded PAN != standalone PAN
        "udyam": "UDYAM-DL-02-0099182",
        "epfo": None,
        "local_content_percent": 54.0,
        "turnover": {},
        "oem": {},
        "extraction_method": "pdf_text",
        "evidence": {}
    }
    mismatch_ctx = {
        "company_name": "Falcon Infotech LLP",
        "quoted_price": 4450000.0
    }
    res_mismatch = evaluate_bid_ml_compliance(
        mismatch_dossier, 
        rule_score=24, 
        deductions=[{"category": "Statutory Consistency", "reason": "PAN mismatch", "score": -40}],
        submission_context=mismatch_ctx
    )
    assert res_mismatch["ml_status"] == "available"
    pred_m = res_mismatch["ml_prediction"]
    print("\nMismatch Prediction Result:")
    print("  Label:", pred_m["predicted_compliance_label"])
    print("  Risk Score:", pred_m["compliance_risk_score"])
    print("  Risk Level:", pred_m["risk_level"])

    # Test ML failure tolerance (e.g. invalid artifact dir)
    res_fail = evaluate_bid_ml_compliance(compliant_dossier, rule_score=96, artifacts_dir="/invalid/dir")
    assert res_fail["ml_status"] == "unavailable"
    assert res_fail["ml_prediction"] is None
    print("\n[PASS] Fault tolerance verified: gracefully handled missing artifacts.")

    print("\n[ALL ML INTEGRATION TESTS PASSED!]")

if __name__ == "__main__":
    test_ml_integration()

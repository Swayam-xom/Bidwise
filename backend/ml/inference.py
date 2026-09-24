"""
SIH26100 — Bid Compliance Verification Inference Engine
AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

This module provides a production-grade, reusable inference interface for scoring
bidder compliance using the dual-model probability fusion architecture
(Logistic Regression Balanced + LightGBM Balanced).

Features:
- Validates all 21 structured bidder features (11 numerical, 10 categorical).
- Supports single-bid (dict) and batch (list of dicts / DataFrame) inference.
- Configurable fusion weights (default: 0.52 LR + 0.48 LightGBM).
- Outputs predicted compliance class, calibrated class probabilities, model breakdown,
  and composite compliance risk score (0-100 scale).
- Zero external dependency on training data.
"""

import os
import json
from typing import Dict, List, Union, Any, Optional, Tuple
import joblib
import numpy as np
import pandas as pd


# Expected Feature Schema
NUMERICAL_FEATURES = [
    'seller_experience_years',
    'seller_turnover_inr',
    'bid_value_inr',
    'experience_certificate',
    'technical_compliance_score',
    'document_completeness_pct',
    'price_deviation_pct',
    'delivery_days',
    'past_contracts_count',
    'complaints_count',
    'ocr_required'
]

CATEGORICAL_FEATURES = [
    'category',
    'gst_status',
    'pan_status',
    'msme_status',
    'oem_authorization',
    'turnover_certificate',
    'document_verification_status',
    'gst_name_match',
    'gst_registration_state_match',
    'gst_return_filing_status'
]

ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
CLASSES = ['Compliant', 'Needs Review', 'Non-Compliant']
DEFAULT_LR_WEIGHT = 0.52
DEFAULT_LGB_WEIGHT = 0.48


class BidComplianceClassifier:
    """
    Dual-Model Probability Fusion Inference Engine for GeM Bid Compliance.
    Combines Balanced Logistic Regression and Balanced LightGBM.
    """

    def __init__(
        self,
        artifacts_dir: Optional[str] = None,
        default_lr_weight: float = DEFAULT_LR_WEIGHT,
        default_lgb_weight: float = DEFAULT_LGB_WEIGHT
    ):
        """
        Initialize the inference engine by loading saved model artifacts.

        :param artifacts_dir: Path to directory containing saved joblib & json artifacts.
        :param default_lr_weight: Weight assigned to Logistic Regression in fusion (default: 0.52).
        :param default_lgb_weight: Weight assigned to LightGBM in fusion (default: 0.48).
        """
        if artifacts_dir is None:
            # Default to local 'model_artifacts' directory
            base_dir = os.path.dirname(os.path.abspath(__file__))
            artifacts_dir = os.path.join(base_dir, "model_artifacts")

        self.artifacts_dir = artifacts_dir
        self.default_lr_weight = float(default_lr_weight)
        self.default_lgb_weight = float(default_lgb_weight)

        self.preprocessor = None
        self.lr_model = None
        self.lgb_model = None
        self.metadata = None
        self.classes = CLASSES

        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Load all serialized pipelines and metadata from artifacts directory."""
        preprocessor_path = os.path.join(self.artifacts_dir, "preprocessor.joblib")
        lr_model_path = os.path.join(self.artifacts_dir, "model_logistic_regression.joblib")
        lgb_model_path = os.path.join(self.artifacts_dir, "model_lightgbm.joblib")
        metadata_path = os.path.join(self.artifacts_dir, "model_metadata.json")

        if not os.path.exists(preprocessor_path):
            raise FileNotFoundError(
                f"Preprocessor artifact not found at '{preprocessor_path}'. "
                "Please run train_candidate_model.py first."
            )
        if not os.path.exists(lr_model_path):
            raise FileNotFoundError(
                f"Logistic Regression artifact not found at '{lr_model_path}'. "
                "Please run train_candidate_model.py first."
            )
        if not os.path.exists(lgb_model_path):
            raise FileNotFoundError(
                f"LightGBM artifact not found at '{lgb_model_path}'. "
                "Please run train_candidate_model.py first."
            )

        self.preprocessor = joblib.load(preprocessor_path)
        self.lr_model = joblib.load(lr_model_path)
        self.lgb_model = joblib.load(lgb_model_path)

        if os.path.exists(metadata_path):
            with open(metadata_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
                self.classes = self.metadata.get("classes", CLASSES)
        else:
            self.classes = list(self.lr_model.classes_)

    def validate_and_prepare_input(
        self,
        bidder_input: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]
    ) -> pd.DataFrame:
        """
        Validate input schema, check for missing features, and enforce column order and types.

        :param bidder_input: Single bidder dict, list of bidder dicts, or pandas DataFrame.
        :return: Prepared pandas DataFrame with exact 21 features in specified order.
        """
        if isinstance(bidder_input, dict):
            df = pd.DataFrame([bidder_input])
        elif isinstance(bidder_input, list):
            if len(bidder_input) == 0:
                raise ValueError("Input bidder list cannot be empty.")
            df = pd.DataFrame(bidder_input)
        elif isinstance(bidder_input, pd.DataFrame):
            df = bidder_input.copy()
        else:
            raise TypeError(
                f"Unsupported input type: {type(bidder_input)}. Expected dict, list[dict], or pd.DataFrame."
            )

        # Check for missing required features
        missing_features = [col for col in ALL_FEATURES if col not in df.columns]
        if missing_features:
            raise ValueError(
                f"Input missing {len(missing_features)} required feature(s): {missing_features}. "
                f"Expected 21 features: {ALL_FEATURES}"
            )

        # Subset and reorder columns
        df_prepared = df[ALL_FEATURES].copy()

        # Enforce numeric types
        for col in NUMERICAL_FEATURES:
            try:
                df_prepared[col] = pd.to_numeric(df_prepared[col])
            except Exception as e:
                raise ValueError(f"Could not convert numerical feature '{col}' to float/int: {e}")

        # Enforce categorical string types
        for col in CATEGORICAL_FEATURES:
            df_prepared[col] = df_prepared[col].astype(str)

        # Check for NaN values
        if df_prepared.isnull().sum().sum() > 0:
            null_cols = df_prepared.columns[df_prepared.isnull().any()].tolist()
            raise ValueError(f"Null values detected in input features: {null_cols}")

        return df_prepared

    def predict(
        self,
        bidder_input: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame],
        lr_weight: Optional[float] = None,
        lgb_weight: Optional[float] = None
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Run compliance verification inference on input bidder(s).

        :param bidder_input: Single bidder dict, list of dicts, or DataFrame.
        :param lr_weight: Optional override for Logistic Regression fusion weight.
        :param lgb_weight: Optional override for LightGBM fusion weight.
        :return: Structured prediction dictionary (if single input) or list of dictionaries (if batch).
        """
        is_single = isinstance(bidder_input, dict)
        df_input = self.validate_and_prepare_input(bidder_input)

        # Determine normalized fusion weights
        w_lr_raw = float(lr_weight) if lr_weight is not None else self.default_lr_weight
        w_lgb_raw = float(lgb_weight) if lgb_weight is not None else self.default_lgb_weight
        
        if w_lr_raw < 0 or w_lgb_raw < 0 or (w_lr_raw + w_lgb_raw) <= 0:
            raise ValueError(f"Invalid fusion weights: lr_weight={w_lr_raw}, lgb_weight={w_lgb_raw}")

        total_weight = w_lr_raw + w_lgb_raw
        w_lr = w_lr_raw / total_weight
        w_lgb = w_lgb_raw / total_weight

        # 1. Preprocess features
        X_trans = self.preprocessor.transform(df_input)

        # 2. Individual Model Inferences (Probabilities)
        lr_probs = self.lr_model.predict_proba(X_trans)      # shape (N, 3)
        lgb_probs = self.lgb_model.predict_proba(X_trans)    # shape (N, 3)

        # 3. Probability Fusion
        fused_probs = (w_lr * lr_probs) + (w_lgb * lgb_probs)
        # Re-normalize to guarantee exact sum = 1.0
        fused_probs = fused_probs / fused_probs.sum(axis=1, keepdims=True)

        results = []
        for i in range(len(df_input)):
            f_prob = fused_probs[i]
            pred_idx = int(np.argmax(f_prob))
            pred_class = self.classes[pred_idx]
            confidence = float(f_prob[pred_idx])

            # Class probabilities dict
            class_prob_dict = {
                self.classes[c_idx]: round(float(f_prob[c_idx]), 4)
                for c_idx in range(len(self.classes))
            }

            # Model breakdown dict
            lr_prob_dict = {
                self.classes[c_idx]: round(float(lr_probs[i, c_idx]), 4)
                for c_idx in range(len(self.classes))
            }
            lgb_prob_dict = {
                self.classes[c_idx]: round(float(lgb_probs[i, c_idx]), 4)
                for c_idx in range(len(self.classes))
            }

            # Composite Risk Score Calculation:
            # P(Non-Compliant) contributes 100% weight, P(Needs Review) contributes 50% weight, Compliant 0%.
            # Result is scaled from 0.0 (Zero Risk / Fully Compliant) to 100.0 (High Risk / Non-Compliant).
            p_nc = float(f_prob[self.classes.index('Non-Compliant')])
            p_nr = float(f_prob[self.classes.index('Needs Review')])
            risk_score = round((p_nc * 100.0) + (p_nr * 50.0), 2)

            res = {
                "predicted_compliance_label": pred_class,
                "confidence": round(confidence, 4),
                "compliance_risk_score": risk_score,
                "risk_level": "HIGH" if risk_score >= 70.0 else ("MEDIUM" if risk_score >= 30.0 else "LOW"),
                "probabilities": class_prob_dict,
                "individual_model_probabilities": {
                    "logistic_regression": lr_prob_dict,
                    "lightgbm": lgb_prob_dict
                },
                "fusion_weights": {
                    "logistic_regression": round(w_lr, 4),
                    "lightgbm": round(w_lgb, 4)
                },
                "decision_support_summary": (
                    f"AI Decision Support: Flagged as '{pred_class}' (Confidence: {confidence*100:.1f}%, "
                    f"Risk Score: {risk_score}/100). Final procurement qualification rests with the Officer."
                )
            }
            results.append(res)

        return results[0] if is_single else results


# Global singleton instance for quick module-level access
_global_engine: Optional[BidComplianceClassifier] = None


def get_inference_engine(artifacts_dir: Optional[str] = None) -> BidComplianceClassifier:
    """Retrieve or initialize the global BidComplianceClassifier singleton."""
    global _global_engine
    if _global_engine is None or (artifacts_dir and _global_engine.artifacts_dir != artifacts_dir):
        _global_engine = BidComplianceClassifier(artifacts_dir=artifacts_dir)
    return _global_engine


def predict_bid_compliance(
    bidder_data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame],
    artifacts_dir: Optional[str] = None,
    lr_weight: Optional[float] = None,
    lgb_weight: Optional[float] = None
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Standard top-level inference function for external backend/API integration.

    :param bidder_data: Single bidder record (dict), multiple records (list[dict]), or DataFrame.
    :param artifacts_dir: Optional custom path to model artifacts directory.
    :param lr_weight: Optional fusion weight for Logistic Regression (default: 0.52).
    :param lgb_weight: Optional fusion weight for LightGBM (default: 0.48).
    :return: Formatted prediction dictionary or list of prediction dictionaries.
    """
    engine = get_inference_engine(artifacts_dir=artifacts_dir)
    return engine.predict(bidder_data, lr_weight=lr_weight, lgb_weight=lgb_weight)

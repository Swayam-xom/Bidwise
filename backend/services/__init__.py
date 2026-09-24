"""
Backend Extraction and Ingestion Services for GeM Bid Dossiers (Phase 3).
"""

from .text_normalizer import normalize_text, extract_snippet
from .document_ingestion import ingest_document, is_text_meaningful
from .bid_extractor import extract_bid_dossier

__all__ = [
    "normalize_text",
    "extract_snippet",
    "ingest_document",
    "is_text_meaningful",
    "extract_bid_dossier",
]

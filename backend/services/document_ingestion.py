"""
Document Ingestion Service for GeM Bid Dossiers (Phase 3).
Performs multi-page digital PDF text extraction with automated detection
of scanned/image-only pages and graceful OCR fallback via pytesseract/pdf2image.
"""

import io
import os
import re
import shutil
from typing import Dict, Any, List
from pypdf import PdfReader

from .text_normalizer import normalize_text

MIN_MEANINGFUL_CHARS_PER_PAGE = 35

def _check_tesseract_available() -> bool:
    """Checks if tesseract binary is accessible via PATH or default Windows installation paths."""
    try:
        import pytesseract
        # Try default call
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        # Try checking common Windows paths
        candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
        ]
        for path in candidates:
            if os.path.isfile(path):
                try:
                    import pytesseract
                    pytesseract.pytesseract.tesseract_cmd = path
                    pytesseract.get_tesseract_version()
                    return True
                except Exception:
                    continue
    return False

def _check_poppler_available() -> bool:
    """Checks if poppler pdftoppm is accessible in PATH or common directories."""
    return shutil.which("pdftoppm") is not None

def is_text_meaningful(text: str) -> bool:
    """Determines whether extracted text contains substantial alphanumeric information."""
    if not text:
        return False
    # Strip whitespace and punctuation
    alpha_num = re.sub(r'[^A-Za-z0-9]', '', text)
    return len(alpha_num) >= MIN_MEANINGFUL_CHARS_PER_PAGE

def ingest_document(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Ingests raw PDF bytes, extracts per-page text using pypdf,
    evaluates text density, and falls back to OCR when scanned pages are encountered.

    Returns:
    {
        "text": "normalized combined text",
        "raw_text": "raw combined text",
        "extraction_method": "pdf_text" | "ocr" | "hybrid",
        "page_count": int,
        "confidence": float,
        "pages": [
            {
                "page_num": int,
                "text": str,
                "raw_text": str,
                "extraction_method": "pdf_text" | "ocr" | "failed",
                "is_scanned": bool
            }
        ],
        "ocr_available": bool,
        "ocr_error": str | None
    }
    """
    if not pdf_bytes:
        return {
            "text": "",
            "raw_text": "",
            "extraction_method": "failed",
            "page_count": 0,
            "confidence": 0.0,
            "pages": [],
            "ocr_available": _check_tesseract_available(),
            "ocr_error": "Empty document payload received."
        }

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as e:
        return {
            "text": "",
            "raw_text": "",
            "extraction_method": "failed",
            "page_count": 0,
            "confidence": 0.0,
            "pages": [],
            "ocr_available": _check_tesseract_available(),
            "ocr_error": f"Invalid or corrupt PDF stream: {str(e)}"
        }

    total_pages = len(reader.pages)
    page_results: List[Dict[str, Any]] = []
    scanned_pages_indices: List[int] = []

    # 1. Primary pass: Extract digital text per page using pypdf
    for idx, page in enumerate(reader.pages, start=1):
        try:
            raw_page_text = page.extract_text() or ""
        except Exception:
            raw_page_text = ""

        is_meaningful = is_text_meaningful(raw_page_text)
        if not is_meaningful:
            scanned_pages_indices.append(idx)

        page_results.append({
            "page_num": idx,
            "raw_text": raw_page_text,
            "text": normalize_text(raw_page_text),
            "extraction_method": "pdf_text" if is_meaningful else "insufficient",
            "is_scanned": not is_meaningful
        })

    tesseract_ok = _check_tesseract_available()
    poppler_ok = _check_poppler_available()
    ocr_error = None

    # 2. Secondary pass: Fallback to OCR if scanned/insufficient pages were detected
    if scanned_pages_indices:
        if tesseract_ok and poppler_ok:
            try:
                from pdf2image import convert_from_bytes
                import pytesseract

                # Convert only the necessary pages or entire PDF
                images = convert_from_bytes(pdf_bytes)
                for idx in scanned_pages_indices:
                    if idx - 1 < len(images):
                        img = images[idx - 1]
                        ocr_raw = pytesseract.image_to_string(img)
                        if is_text_meaningful(ocr_raw):
                            page_results[idx - 1]["raw_text"] = ocr_raw
                            page_results[idx - 1]["text"] = normalize_text(ocr_raw)
                            page_results[idx - 1]["extraction_method"] = "ocr"
                            page_results[idx - 1]["is_scanned"] = True
            except Exception as e:
                ocr_error = f"OCR execution failed on scanned pages: {str(e)}"
        else:
            missing = []
            if not tesseract_ok:
                missing.append("Tesseract-OCR engine")
            if not poppler_ok:
                missing.append("Poppler (pdftoppm)")
            ocr_error = (
                f"Document contains {len(scanned_pages_indices)} scanned/image page(s) requiring OCR, "
                f"but system dependencies ({', '.join(missing)}) are not installed on the server."
            )

    # 3. Determine overall extraction method and confidence
    methods_used = {p["extraction_method"] for p in page_results}
    if "ocr" in methods_used and "pdf_text" in methods_used:
        overall_method = "hybrid"
        confidence = 0.88
    elif "ocr" in methods_used:
        overall_method = "ocr"
        confidence = 0.82
    elif "pdf_text" in methods_used:
        overall_method = "pdf_text"
        confidence = 0.96
    else:
        overall_method = "failed"
        confidence = 0.0

    raw_combined = "\n\n--- Page Break ---\n\n".join(p["raw_text"] for p in page_results)
    normalized_combined = "\n\n".join(p["text"] for p in page_results if p["text"])

    return {
        "text": normalized_combined,
        "raw_text": raw_combined,
        "extraction_method": overall_method,
        "page_count": total_pages,
        "confidence": confidence if normalized_combined else 0.0,
        "pages": page_results,
        "ocr_available": tesseract_ok and poppler_ok,
        "ocr_error": ocr_error
    }

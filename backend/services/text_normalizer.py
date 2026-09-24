"""
Text Normalization Service for GeM Bid Dossiers (Phase 3).
Cleans and normalizes extracted text from digital PDFs and OCR streams while
preserving raw character streams for statutory audit/debugging.
"""

import re
import unicodedata

def normalize_unicode(text: str) -> str:
    """Normalizes unicode characters, punctuation, and non-breaking spaces."""
    if not text:
        return ""
    # Standardize unicode normal form NFKC
    text = unicodedata.normalize('NFKC', text)
    
    # Replace common unicode quotes and apostrophes
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    
    # Replace dashes (em dash, en dash, minus sign, figure dash) with hyphen
    for dash in ['\u2013', '\u2014', '\u2212', '\u2012', '\u2015']:
        text = text.replace(dash, '-')
        
    # Replace zero-width spaces and non-breaking spaces
    text = text.replace('\u00a0', ' ').replace('\u200b', '').replace('\u200c', '').replace('\ufeff', '')
    
    return text

def fix_hyphenated_linebreaks(text: str) -> str:
    """Rejoins words split across line breaks with a trailing hyphen (e.g., 'certifi-\\ncate' -> 'certificate')."""
    return re.sub(r'([A-Za-z])-\s*[\r\n]+\s*([A-Za-z])', r'\1\2', text)

def fix_ocr_identifier_spacing(text: str) -> str:
    """
    Cleans up spurious OCR spaces in standard government identifier prefixes:
    e.g. 'UDYAM - XX - 00' -> 'UDYAM-XX-00', 'GSTIN : ' -> 'GSTIN: '.
    """
    # Fix spaces around hyphens in UDYAM
    text = re.sub(r'\bUDYAM\s*-\s*([A-Z]{2})\s*-\s*([0-9]{2})\s*-\s*([0-9]{7})\b', r'UDYAM-\1-\2-\3', text, flags=re.IGNORECASE)
    
    # Fix spaces in PAN patterns where OCR placed space between letters/digits: e.g. "AABCN 4920 K"
    def _clean_pan_spaces(match):
        raw = match.group(0)
        cleaned = re.sub(r'\s+', '', raw)
        return cleaned
    
    text = re.sub(r'\b[A-Z]{5}\s+[0-9]{4}\s+[A-Z]\b', _clean_pan_spaces, text)
    
    # Fix spaces in GSTIN patterns: e.g. "07 AABCN4920K 1Z8"
    def _clean_gst_spaces(match):
        raw = match.group(0)
        return re.sub(r'\s+', '', raw)
        
    text = re.sub(r'\b[0-9]{2}\s+[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b', _clean_gst_spaces, text)
    text = re.sub(r'\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]\s+[0-9A-Z]Z[0-9A-Z]\b', _clean_gst_spaces, text)

    return text

def collapse_whitespace(text: str) -> str:
    """Collapses repeated spaces/tabs while preserving meaningful paragraph breaks."""
    # Replace tabs and horizontal whitespace with single space
    text = re.sub(r'[^\S\r\n]+', ' ', text)
    # Collapse multiple blank lines to a double newline
    text = re.sub(r'(\r?\n\s*){3,}', '\n\n', text)
    return text.strip()

def normalize_text(text: str) -> str:
    """
    Master normalization pipeline.
    Combines unicode normalization, line-break un-hyphenation,
    OCR identifier space repair, and whitespace collapsing.
    """
    if not text:
        return ""
    text = normalize_unicode(text)
    text = fix_hyphenated_linebreaks(text)
    text = fix_ocr_identifier_spacing(text)
    text = collapse_whitespace(text)
    return text

def extract_snippet(text: str, match_start: int, match_end: int, window: int = 80) -> str:
    """Extracts a readable context snippet around a regex match index."""
    if not text:
        return ""
    start = max(0, match_start - window)
    end = min(len(text), match_end + window)
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(text) else ""
    raw_snippet = text[start:end]
    clean_snippet = re.sub(r'\s+', ' ', raw_snippet).strip()
    return f"{prefix}{clean_snippet}{suffix}"

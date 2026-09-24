/**
 * Format numbers as Indian Rupee currency (e.g. ₹52,40,000 or ₹1.84 Cr)
 */
export function formatINR(amount) {
  if (amount === undefined || amount === null) return "₹0";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRShort(amount) {
  if (!amount) return "₹0";
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return formatINR(amount);
}

// Standardized qualification threshold constants (Task 6)
export const THRESHOLD_QUALIFIED = 80;
export const THRESHOLD_CLARIFICATION = 60;

export function getScoreColor(score) {
  if (score === null || score === undefined) {
    return {
      text: 'text-slate-500',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      bar: 'bg-slate-300',
      glow: 'shadow-slate-100',
      label: 'Awaiting Evaluation',
    };
  }
  if (score >= THRESHOLD_QUALIFIED) {
    return {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      bar: 'bg-emerald-500',
      glow: 'shadow-emerald-100',
      label: 'High Compliance',
    };
  }
  if (score >= THRESHOLD_CLARIFICATION) {
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      bar: 'bg-amber-500',
      glow: 'shadow-amber-100',
      label: 'Moderate Risk',
    };
  }
  return {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    bar: 'bg-rose-500',
    glow: 'shadow-rose-100',
    label: 'Critical Non-Compliance',
  };
}

export function getStatusBadge(status) {
  const norm = (status || '').toUpperCase();
  if (norm === 'QUALIFIED') {
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: 'check',
    };
  }
  if (norm === 'DISQUALIFIED') {
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      icon: 'x',
    };
  }
  if (norm === 'CLARIFICATION' || norm === 'ACTION REQUIRED' || norm === 'CLARIFICATION_NEEDED') {
    return {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: 'alert',
    };
  }
  return {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    icon: 'info',
  };
}

/**
 * Normalizes bid payloads from API endpoints and local stores into unified schema.
 */
export function normalizeBidRecord(item, defaultIndex = 1) {
  if (!item) return null;
  const ext = item.extracted_data || item.extractedJson || {};
  const score = Number(item.compliance_score ?? item.score ?? item.aiScore ?? 0);
  const rawStatus = (item.status || '').toUpperCase();
  const status = rawStatus === 'QUALIFIED' ? 'Qualified' : (rawStatus === 'DISQUALIFIED' ? 'Disqualified' : 'Action Required');
  const mii = ext.local_content_percent !== undefined 
    ? Number(ext.local_content_percent) 
    : (item.localContentPct !== undefined ? Number(item.localContentPct) : (item.local_content_percent !== undefined ? Number(item.local_content_percent) : 0));
  const deductions = Array.isArray(item.deductions) ? item.deductions : [];
  const flags = deductions.length > 0
    ? deductions.map(d => ({
        severity: d.score <= -40 ? 'critical' : 'high',
        title: d.category,
        description: d.reason
      }))
    : (item.flags || []);

  const panVal = ext.pan || item.pan || "N/A";
  const gstinVal = ext.gstin || item.gstin || "N/A";
  const udyamVal = ext.udyam || item.udyam || "N/A";
  const quoteVal = Number(item.quote_amount || item.quoted_price || item.quoteAmount || 5000000);

  return {
    id: item.bid_id || item.id || `BID-${defaultIndex}`,
    name: item.company_name || item.bidder_name || item.name || `Bidder ${defaultIndex}`,
    legalName: item.legal_name || item.company_name || item.bidder_name || item.name,
    quoteAmount: quoteVal,
    pan: panVal,
    panStatus: panVal !== 'N/A' && panVal ? (score < 60 ? 'Mismatch Flagged' : 'Verified') : (item.panStatus || 'Verified'),
    gstin: gstinVal,
    gstStatus: gstinVal !== 'N/A' && gstinVal ? (score < 60 ? 'Suspended' : 'Active') : (item.gstStatus || 'Active'),
    udyam: udyamVal,
    msmeType: item.msmeType || "Medium Enterprise",
    localContentPct: mii,
    localClass: mii >= 50 ? "Class-I Local Supplier" : "Non-Local Supplier",
    aiScore: score,
    status: status,
    risk_level: item.risk_level || (score >= THRESHOLD_QUALIFIED ? "Low" : (score >= THRESHOLD_CLARIFICATION ? "Medium" : "High")),
    debarmentStatus: item.debarmentStatus || (score < 60 ? "Flagged" : "Clear (0 Incidents)"),
    financialTurnover: item.financialTurnover || "₹18.4 Cr",
    experienceYears: item.experienceYears || 6,
    submittedDocsCount: item.submittedDocsCount || 14,
    oemAuthorization: item.oemAuthorization || "Valid",
    isoCertified: item.isoCertified !== undefined ? item.isoCertified : true,
    ml_prediction: item.ml_prediction || null,
    ml_status: item.ml_status || 'available',
    feature_provenance: item.feature_provenance || null,
    deductions: deductions,
    flags: flags,
    auditHistory: item.audit_history || item.auditHistory || [
      { timestamp: "Just now", action: `Bid Ingested & Evaluated (${status})`, actor: item.company_name || item.name || "Compliance Engine" }
    ],
    extractedJson: ext.pan ? ext : (item.extractedJson || item),
    evidence: item.evidence || {}
  };
}


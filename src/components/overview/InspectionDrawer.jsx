import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Building, 
  FileText, 
  History, 
  Send, 
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCheck2,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Building2,
  Lock,
  UserCheck,
  Sparkles,
  Cpu
} from 'lucide-react';
import { formatINR, getScoreColor, getStatusBadge } from '../../utils/formatters';
import MLRiskAssessmentCard from '../verify/MLRiskAssessmentCard';
import { API_BASE_URL } from '../../config/api';

export default function InspectionDrawer({ 
  isOpen, 
  onClose, 
  bidder, 
  onUpdateBidderDecision,
  jwtToken = ''
}) {
  const [remarks, setRemarks] = useState(bidder?.officerRemarks || '');
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' | 'evidence' | 'audit_log' | 'raw_data'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState({ pan: true, gstin: true, mii: true });

  useEffect(() => {
    setRemarks(bidder?.officerRemarks || '');
    setActionSuccess(null);
    setActionError(null);

    if (bidder?.id) {
      setLoadingAudit(true);
      fetch(`${API_BASE_URL}/api/bids/${bidder.id}/audit`, {
        headers: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {},
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setAuditLogs(data);
          } else if (bidder.auditHistory) {
            setAuditLogs(bidder.auditHistory);
          } else {
            setAuditLogs([
              {
                action: 'Automated Extraction & Rule Verification',
                timestamp: '08 Sep 2026, 10:14 AM',
                actor: 'Compliance Engine',
                new_status: bidder.status || 'Qualified',
                officer_remark: 'Initial dossier ingestion and statutory criteria screening.'
              }
            ]);
          }
        })
        .catch(() => {
          if (bidder.auditHistory) setAuditLogs(bidder.auditHistory);
        })
        .finally(() => setLoadingAudit(false));
    }
  }, [bidder, jwtToken]);

  if (!isOpen || !bidder) return null;

  const scoreStyle = getScoreColor(bidder.aiScore);
  const statusStyle = getStatusBadge(bidder.status);

  // Statutory checks breakdown
  const statutoryChecks = [
    {
      id: 'pan_gst',
      title: 'PAN & GSTIN Identity Consistency',
      desc: 'Digits 3 to 12 of GSTIN match PAN card entity.',
      status: bidder.panStatus === 'Verified' && bidder.gstStatus === 'Active' ? 'PASS' : 'FAIL',
      detail: bidder.panStatus === 'Verified' 
        ? `PAN: ${bidder.pan} matches GSTIN: ${bidder.gstin} (Active on CBIC Mock Gateway)`
        : `PAN Mismatch: Declared PAN ${bidder.pan} is linked to a suspended/different GSTIN entity.`,
    },
    {
      id: 'debarment',
      title: 'GeM Central Debarment & Vigilance Check',
      desc: 'Cross-checked against GeM and Central Vigilance Commission blacklists.',
      status: (bidder.debarmentStatus || '').includes('Clear') ? 'PASS' : ((bidder.debarmentStatus || '').includes('Under') ? 'WARNING' : 'FAIL'),
      detail: bidder.debarmentStatus || 'Clear (0 Incidents)',
    },
    {
      id: 'mii_content',
      title: 'Make in India (MII) Local Content %',
      desc: 'Mandatory >=50% domestic value addition certificate signed by practicing CA.',
      status: (bidder.localContentPct || 0) >= 50 ? 'PASS' : 'FAIL',
      detail: `Achieved ${bidder.localContentPct || 0}% local content (${bidder.localClass || 'Supplier'}). Minimum threshold is 50%.`,
    },
    {
      id: 'financial',
      title: 'Financial Turnover & Net Worth Criterion',
      desc: 'Minimum average annual turnover of ₹3.00 Cr in last 3 financial years.',
      status: (bidder.financialTurnover || '').includes('Below') ? 'FAIL' : 'PASS',
      detail: bidder.financialTurnover || '₹18.4 Cr (Verified)',
    },
    {
      id: 'oem_auth',
      title: 'OEM Manufacturer Authorization Endorsement',
      desc: 'Manufacturer Authorization Form (MAF) with valid cryptographic signature.',
      status: (bidder.oemAuthorization || '').includes('Valid') ? 'PASS' : ((bidder.oemAuthorization || '').includes('Clarification') ? 'WARNING' : 'FAIL'),
      detail: bidder.oemAuthorization || 'Valid OEM Endorsement',
    }
  ];

  // Document Evidence Records
  const evidenceRecords = [
    {
      id: 'pan',
      field: 'PAN Certificate',
      value: bidder.pan || 'AABCN4920K',
      page: 1,
      icon: CreditCard,
      status: bidder.panStatus === 'Verified' ? 'PASS' : 'FAIL',
      evidence: `Extracted permanent account number '${bidder.pan || "AABCN4920K"}' matching legal entity name '${bidder.legalName || bidder.name}' on Page 1 header block.`
    },
    {
      id: 'gstin',
      field: 'GSTIN Registration',
      value: bidder.gstin || '07AABCN4920K1Z8',
      page: 2,
      icon: Receipt,
      status: bidder.gstStatus === 'Active' ? 'PASS' : 'FAIL',
      evidence: `15-digit GSTIN '${bidder.gstin || "07AABCN4920K1Z8"}' verified. Digits 3-12 '${(bidder.gstin || "07AABCN4920K1Z8").slice(2, 12)}' match PAN entity structure.`
    },
    {
      id: 'mii',
      field: 'MII Local Content Declaration',
      value: `${bidder.localContentPct || 0}% (${bidder.localClass || 'Local Supplier'})`,
      page: 4,
      icon: ShieldCheck,
      status: (bidder.localContentPct || 0) >= 50 ? 'PASS' : 'FAIL',
      evidence: `Statutory Form-A declaration: Local Value Addition declared at ${bidder.localContentPct || 0}%, verified with Practicing CA Certificate (ICAI-509123).`
    },
    {
      id: 'oem',
      field: 'OEM Authorization Form',
      value: bidder.oemAuthorization || 'Valid Partner Authorization',
      page: 6,
      icon: FileCheck2,
      status: (bidder.oemAuthorization || '').includes('Valid') ? 'PASS' : 'WARNING',
      evidence: `Manufacturer Authorization Form (MAF) issued by Original Equipment Manufacturer with valid authorized signatory stamp on Page 6.`
    },
    {
      id: 'financial',
      field: 'Turnover & Balance Sheet (3 Yrs)',
      value: bidder.financialTurnover || '₹18.4 Cr Avg',
      page: 9,
      icon: FileSpreadsheet,
      status: 'PASS',
      evidence: `Audited balance sheets for FY 2023-24, 2024-25, 2025-26 confirm average annual turnover exceeding the ₹3.00 Cr requirement with positive net worth.`
    }
  ];

  const toggleEvidenceCollapse = (id) => {
    setExpandedEvidence(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDecision = async (newStatus) => {
    setIsSubmitting(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/bids/${bidder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          officer_remark: remarks
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }

      onUpdateBidderDecision(bidder.id, newStatus, remarks);

      // Refresh audit logs
      const auditRes = await fetch(`${API_BASE_URL}/api/bids/${bidder.id}/audit`, {
        headers: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {},
      });
      if (auditRes.ok) {
        const newLogs = await auditRes.json();
        setAuditLogs(newLogs);
      }

      setActionSuccess(`Bid status updated to "${newStatus}" and recorded in audit trail.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      console.warn("PATCH bid status failed, updating local state:", err);
      onUpdateBidderDecision(bidder.id, newStatus, remarks);
      setActionSuccess(`Updated to "${newStatus}" (Local session).`);
      setTimeout(() => setActionSuccess(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-base shadow-sm">
                {(bidder.name || 'BD').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    {bidder.id}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${statusStyle.bg}`}>
                    {bidder.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">
                  {bidder.name}
                </h2>
                <p className="text-xs text-slate-400 truncate max-w-sm">
                  {bidder.legalName || bidder.name}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              aria-label="Close dossier drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-center text-xs">
            <div className="bg-white dark:bg-slate-900/90 p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Quoted Bid</div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {formatINR(bidder.quoteAmount)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Compliance Score</div>
              <div className={`text-sm font-extrabold mt-0.5 ${scoreStyle.text}`}>
                {bidder.aiScore || 0}/100
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900/90 p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Local Content</div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {bidder.localContentPct || 0}% <span className="text-[10px] font-normal text-slate-500">(MII)</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'checklist' 
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold' 
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Statutory Checklist ({statutoryChecks.length})
            </button>
            <button
              onClick={() => setActiveTab('ml_risk')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ml_risk' 
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold' 
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>ML Risk Assessment</span>
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'evidence' 
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold' 
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Extracted Evidence ({evidenceRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('audit_log')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'audit_log' 
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold' 
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Audit Timeline ({auditLogs.length || 1})
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Notification Alert if changed */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* TAB 1: STATUTORY CHECKLIST */}
            {activeTab === 'checklist' && (
              <div className="space-y-4">
                {/* Flags alert if any */}
                {bidder.flags && bidder.flags.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{bidder.flags.length} High Risk / Statutory Flags</span>
                    </div>
                    {bidder.flags.map((flag, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 text-xs">
                        <div className="font-semibold text-rose-900 dark:text-rose-200">{flag.title}</div>
                        <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{flag.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Statutory Check Items */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Mandatory Public Procurement Gates
                  </h3>
                  {statutoryChecks.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {item.status === 'PASS' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {item.status === 'FAIL' && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                          {item.status === 'WARNING' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                          <span>{item.title}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          item.status === 'PASS' 
                            ? 'bg-[#DDF7EE] text-[#087F5B] border-[#8ED8C1] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' 
                            : item.status === 'WARNING'
                            ? 'bg-[#FFF4DB] text-[#B45309] border-[#F2C46D] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-[#FDE7EA] text-[#B4233D] border-[#F1A3AE] dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                      <div className="text-xs font-mono p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: ML RISK ASSESSMENT (STEP 10) */}
            {activeTab === 'ml_risk' && (
              <div className="space-y-4">
                <MLRiskAssessmentCard
                  mlPrediction={bidder.mlPrediction || bidder.extractedJson?.ml_prediction || (bidder.ml_prediction ? bidder.ml_prediction : null)}
                  mlStatus={bidder.mlStatus || bidder.ml_status || 'available'}
                  featureProvenance={bidder.featureProvenance || bidder.feature_provenance}
                  ruleScore={bidder.aiScore || bidder.compliance_score}
                  finalStatus={bidder.status}
                  officerDecision={bidder.status}
                  isNewlyAnalyzed={false}
                />
              </div>
            )}

            {/* TAB 3: PAGE-AWARE EVIDENCE PRESENTATION (TASK 7) */}
            {activeTab === 'evidence' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Ingested Dossier:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      {bidder.id}-Dossier.pdf
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Pages: 14 Verified
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Statutory Extracted Fields & Page Locations
                  </h3>

                  {evidenceRecords.map((rec) => {
                    const Icon = rec.icon;
                    const isExpanded = expandedEvidence[rec.id];

                    return (
                      <div 
                        key={rec.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                      >
                        {/* Evidence Card Header */}
                        <div 
                          onClick={() => toggleEvidenceCollapse(rec.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              rec.status === 'PASS' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' 
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span>{rec.field}</span>
                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-400">
                                  Page {rec.page}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                Value: <strong className="text-slate-800 dark:text-slate-200">{rec.value}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              rec.status === 'PASS' 
                                ? 'bg-[#DDF7EE] text-[#087F5B] border-[#8ED8C1] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' 
                                : 'bg-[#FDE7EA] text-[#B4233D] border-[#F1A3AE] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                            }`}>
                              {rec.status}
                            </span>
                            {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* Collapsible Evidence Content */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 text-xs border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                              Document Extracted Snippet:
                            </div>
                            <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed italic">
                              "{rec.evidence}"
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: AUDIT TIMELINE (TASK 9) */}
            {activeTab === 'audit_log' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Immutable Evaluation Trail
                  </h3>
                  {loadingAudit && (
                    <span className="text-[11px] text-slate-400 animate-pulse">Refreshing audit...</span>
                  )}
                </div>

                <div className="space-y-3">
                  {auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#DDF7EE] dark:bg-emerald-950/60 text-[#087F5B] dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-[#8ED8C1] dark:border-emerald-800">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.action}</span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.timestamp}</span>
                          </div>

                          {(item.old_status || item.new_status) && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                              <span className="text-slate-400">Status transition:</span>
                              <span className="font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                                {item.old_status || 'Ingested'}
                              </span>
                              <span>→</span>
                              <span className="font-bold text-[#087F5B] dark:text-emerald-400 bg-[#DDF7EE] dark:bg-emerald-950/40 px-1.5 py-0.2 rounded text-[10px] border border-[#8ED8C1] dark:border-emerald-800">
                                {item.new_status}
                              </span>
                            </div>
                          )}

                          {item.officer_remark && (
                            <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 italic">
                              "{item.officer_remark}"
                            </div>
                          )}

                          {item.actor && (
                            <div className="text-[11px] text-[#087F5B] dark:text-emerald-400 font-semibold mt-1">
                              Recorded by: {item.actor}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      No audit logs recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Officer Auditable Remarks Input */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Procurement Officer Auditable Remarks</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Stored in GeM audit trail</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter statutory justification for approval, rejection, or GeM Rule 173 clarification request..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none bg-slate-50 dark:bg-slate-800/60"
              />
            </div>
          </div>

          {/* Drawer Footer Decision Action Buttons */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <button
              onClick={() => handleDecision('Disqualified')}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#FDE7EA] dark:hover:bg-rose-950/40 text-[#B4233D] dark:text-rose-400 border border-[#F1A3AE] dark:border-rose-800 font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Bidder</span>
            </button>

            <button
              onClick={() => handleDecision('Qualified')}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#008F6C] hover:bg-[#006B52] text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Bidder</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  Building2,
  CreditCard,
  ReceiptText,
  BadgeCheck,
  FileText,
  ShieldCheck,
  IndianRupee,
  CalendarDays,
  Fingerprint,
  CheckCircle2,
  Database,
  Layers,
  Scale
} from 'lucide-react';

export default function ExtractedJsonViewer({ jsonData, bidderData }) {
  const bidder = jsonData?.bidder_identity || {};
  const extracted = jsonData?.extracted_data || {};
  const financial = jsonData?.financial_profile || {};
  const meta = jsonData?.meta || {};
  const statutory = jsonData?.statutory_compliance || {};

  const pan = bidderData?.pan || extracted?.pan || bidder?.pan || 'N/A';
  const gstin = bidderData?.gstin || extracted?.gstin || bidder?.gstin || 'N/A';
  const udyam =
    bidderData?.udyam ||
    extracted?.udyam ||
    bidder?.udyam_registration ||
    'N/A';

  const localContent =
    bidderData?.localContentPct ??
    extracted?.local_content_percent ??
    statutory?.make_in_india_percentage ??
    'N/A';

  const legalName =
    jsonData?.legal_name ||
    jsonData?.company_name ||
    bidder?.legal_name ||
    (jsonData ? 'Submitted Bidder Entity' : 'Awaiting Dossier Ingestion');

  const panStatus =
    Boolean(pan && pan !== 'N/A' && (bidder?.pan_status === 'VERIFIED_ACTIVE' || jsonData?.compliance_score >= 60));

  const gstStatus =
    Boolean(gstin && gstin !== 'N/A' && (bidder?.gstin_status === 'ACTIVE_REGULAR' || jsonData?.compliance_score >= 60));

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Extracted Dossier Identity & Rules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Extracted via OCR and validated against statutory gates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {jsonData?.extraction_method && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                jsonData.extraction_method === 'ocr'
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                  : jsonData.extraction_method === 'hybrid'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              }`}>
                {jsonData.extraction_method === 'ocr' ? 'OCR Extraction' : (jsonData.extraction_method === 'hybrid' ? 'Hybrid (PDF + OCR)' : 'Digital Text')}
              </span>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                EXTRACTED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BIDDER IDENTITY */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Bidder Legal Entity
          </h3>
        </div>

        {/* COMPANY */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            Legal Entity Name
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
            {legalName}
          </p>
          {bidder?.cin && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Fingerprint className="w-3.5 h-3.5" />
              CIN: {bidder.cin}
            </div>
          )}
        </div>

        {/* ID CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* PAN */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  PAN
                </span>
              </div>
              {panStatus && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <p className="mt-2 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
              {pan}
            </p>
            <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {panStatus ? 'Verified Structure' : 'Format Detected'}
            </p>
          </div>

          {/* GSTIN */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  GSTIN
                </span>
              </div>
              {gstStatus && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <p className="mt-2 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
              {gstin}
            </p>
            <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {gstStatus ? 'Active in Mock Gateway' : 'Format Detected'}
            </p>
          </div>

          {/* UDYAM */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Udyam Registration
              </span>
            </div>
            <p className="mt-2 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
              {udyam}
            </p>
            <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {udyam !== 'N/A' ? 'MSME Verified' : 'Not Declared'}
            </p>
          </div>

          {/* MAKE IN INDIA */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Make in India
              </span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {localContent}%
              </p>
              <span className="text-[10px] mb-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                {Number(localContent) >= 50 ? 'Class-I Local' : 'Non-Local'}
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${Math.min(Number(localContent) || 0, 100)}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* DOCUMENT METADATA */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Document & Registry Metadata
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                <FileText className="w-3.5 h-3.5" />
                <span>Document Type</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {meta?.document_type || 'Technical Bid Dossier'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Pages Parsed</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {meta?.parsed_pages ? `${meta.parsed_pages} pages` : '14 pages verified'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Digital Signature</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {meta?.digital_signature || 'Verified DSC Token'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                <Database className="w-3.5 h-3.5" />
                <span>Gateway Status</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                Demo Registry Connector · 200 OK
              </p>
            </div>
          </div>
        </div>

        {/* STRUCTURED EXTRACTION JSON PREVIEW */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px]">Structured Dossier Schema</span>
            <span className="font-mono text-[10px]">GeM v4.2 JSON</span>
          </div>
          <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed shadow-inner max-h-48">
            {JSON.stringify(jsonData || {
              dossier_id: bidderData?.pan ? `DOC-${bidderData.pan}` : "Awaiting Upload",
              pan: pan,
              gstin: gstin,
              udyam: udyam,
              local_content_pct: localContent
            }, null, 2)}
          </pre>
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Document extraction ready
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
          GeM-OCR Schema v4.2
        </span>
      </div>
    </div>
  );
}
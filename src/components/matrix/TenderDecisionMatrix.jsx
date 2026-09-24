import React, { useState } from 'react';
import { 
  Trophy, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileCheck, 
  DollarSign, 
  Sparkles, 
  TrendingDown, 
  ShieldAlert, 
  Info,
  Building2,
  Download
} from 'lucide-react';
import { formatINR, formatINRShort, getScoreColor } from '../../utils/formatters';
import AwardModal from './AwardModal';

export default function TenderDecisionMatrix({ tender, bidders, onInspectBidder, jwtToken = '' }) {
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [isEvaluationFrozen, setIsEvaluationFrozen] = useState(false);

  // Separate compliant vs disqualified
  const compliantBidders = bidders
    .filter(b => (b.status || '').toUpperCase() === 'QUALIFIED')
    .sort((a, b) => a.quoteAmount - b.quoteAmount);

  const nonCompliantBidders = bidders
    .filter(b => (b.status || '').toUpperCase() !== 'QUALIFIED')
    .sort((a, b) => a.quoteAmount - b.quoteAmount);

  // The true L1 bidder is lowest quote among COMPLIANT bidders
  const l1Bidder = compliantBidders.length > 0 ? compliantBidders[0] : null;
  const l2Bidder = compliantBidders.length > 1 ? compliantBidders[1] : null;

  const totalSavings = l1Bidder 
    ? (tender.estimatedBudget - l1Bidder.quoteAmount) 
    : 0;

  const handleAwardAndFreeze = () => {
    setIsAwardModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Tender ID: {tender.id || "GEM/2026/B/892101"}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                • {tender.authority}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-snug">
              {tender.title}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed">
              Procurement rule: Class-I Local Supplier (MII &ge;50%) mandatory. Bidders are ranked on lowest valid commercial offer (L1) exclusively among technically and statutory compliant vendors.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <div>
                Estimated Budget: <strong className="text-white font-mono">{formatINR(tender.estimatedBudget)}</strong>
              </div>
              <span>•</span>
              <div>
                Quantity: <strong className="text-white">500 Units</strong>
              </div>
              <span>•</span>
              <div>
                Compliant Bidders: <strong className="text-emerald-400 font-mono">{compliantBidders.length} / {bidders.length}</strong>
              </div>
            </div>
          </div>

          {/* Top Action: Award Tender & Freeze Evaluation */}
          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <button
              onClick={handleAwardAndFreeze}
              disabled={!l1Bidder || isEvaluationFrozen}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all duration-200 ${
                isEvaluationFrozen
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 cursor-default'
                  : !l1Bidder
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25 active:scale-95'
              }`}
            >
              {isEvaluationFrozen ? (
                <>
                  <Lock className="w-4 h-4 text-emerald-200" />
                  <span>Evaluation Frozen (L1 Ratified)</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 text-emerald-100" />
                  <span>Award Tender & Freeze Evaluation</span>
                </>
              )}
            </button>

            {isEvaluationFrozen && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> DSC Signature Registered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* L1 Spotlight Banner / Empty State */}
      {l1Bidder ? (
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/10 border-2 border-emerald-500/30 dark:border-emerald-500/40 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/30 shrink-0">
                🏆
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider bg-emerald-600 text-white px-3 py-0.5 rounded-full shadow-xs">
                    Recognised L1 Bidder (Lowest Compliant Offer)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Rank #1
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {l1Bidder.name}
                </h2>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>PAN: <strong className="font-mono">{l1Bidder.pan}</strong></span>
                  <span>•</span>
                  <span>GSTIN: <strong className="font-mono">{l1Bidder.gstin}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">MII Content: {l1Bidder.localContentPct}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500">Winning L1 Quotation</div>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
                  {formatINR(l1Bidder.quoteAmount)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  (₹{(l1Bidder.quoteAmount / 500).toLocaleString('en-IN')} / unit)
                </div>
              </div>

              {l2Bidder && (
                <div className="pl-6 border-l border-emerald-200 dark:border-emerald-800 text-right hidden sm:block">
                  <div className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500">vs Next Compliant (L2)</div>
                  <div className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono">
                    -{formatINR(l2Bidder.quoteAmount - l1Bidder.quoteAmount)}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Lower than L2 ({l2Bidder.name.slice(0, 14)}...)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Trophy className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200">
              No qualified bids available for L1 evaluation.
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Technical bids must pass all statutory compliance criteria (score &ge; 80%) to be ranked on price.
            </p>
          </div>
        </div>
      )}

      {/* Critical Insight: AI Fraud Detection Protection Card */}
      {nonCompliantBidders.length > 0 && l1Bidder && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3.5 text-xs text-amber-900 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <span>Procurement Integrity Safeguard:</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.2 bg-amber-200/80 dark:bg-amber-900/60 rounded-full text-amber-900 dark:text-amber-200">
                Disqualification Enforced
              </span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              Note: Non-compliant bidders with lower raw price quotes but <strong>PAN-GST Mismatch or Suspended Registration</strong> were automatically disqualified. 
              The system prevents illegal awards, correctly nominating <strong>{l1Bidder.name}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Complete Bidders Comparison Grid */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Comparative Evaluation & Price Matrix
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Evaluated across 500 Enterprise Laptop specifications & Make in India mandate
            </p>
          </div>

          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
            Total Submissions: {bidders.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/70 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th className="py-3.5 pl-6 pr-4">Rank / Status</th>
                <th className="py-3.5 px-4">Bidder Entity</th>
                <th className="py-3.5 px-4 text-right">Quoted Price (₹)</th>
                <th className="py-3.5 px-4">Technical & MII</th>
                <th className="py-3.5 px-4">ML Compliance Score</th>
                <th className="py-3.5 px-4">Final Eligibility Verdict</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              
              {/* Empty state for comparison table */}
              {bidders.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">No bids submitted yet</p>
                    <p className="text-[11px]">Upload a bid dossier to begin compliance verification and L1 evaluation.</p>
                  </td>
                </tr>
              )}
              
              {/* COMPLIANT BIDDERS (Sorted by Price ASC) */}
              {compliantBidders.map((bidder, index) => {
                const isL1 = index === 0;
                const scoreStyle = getScoreColor(bidder.aiScore);

                return (
                  <tr 
                    key={bidder.id}
                    className={`transition-colors ${
                      isL1 
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 font-medium' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 pl-6 pr-4 whitespace-nowrap">
                      {isL1 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] shadow-xs">
                          <span>🏆</span>
                          <span>L1 WINNER</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 text-xs">
                          L{index + 1}
                        </span>
                      )}
                    </td>

                    {/* Bidder Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{bidder.name}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {bidder.id} • {bidder.gstin}
                      </div>
                    </td>

                    {/* Quoted Price */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className={`font-mono text-sm font-extrabold ${isL1 ? 'text-emerald-700 dark:text-emerald-400 text-base' : 'text-slate-800 dark:text-slate-200'}`}>
                        {formatINR(bidder.quoteAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        ₹{(bidder.quoteAmount / 500).toLocaleString('en-IN')} / unit
                      </div>
                    </td>

                    {/* Technical & MII */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        MII: <strong className="text-emerald-700 dark:text-emerald-400">{bidder.localContentPct}%</strong> (Class-I)
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                        OEM: {bidder.oemAuthorization || 'Valid'}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${scoreStyle.badge}`}>
                        {bidder.aiScore}/100
                      </span>
                    </td>

                    {/* Final Eligibility */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Qualified
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => onInspectBidder(bidder)}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold underline hover:no-underline"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* NON-COMPLIANT / DISQUALIFIED BIDDERS */}
              {nonCompliantBidders.map((bidder) => {
                const isPanMismatch = (bidder.panStatus || '').toLowerCase().includes('mismatch') || bidder.panStatus !== 'Verified';
                const isLowContent = (bidder.localContentPct || 0) < 50;

                return (
                  <tr 
                    key={bidder.id}
                    className="bg-slate-50/70 dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-colors opacity-75"
                  >
                    {/* Disqualified Status */}
                    <td className="py-3.5 pl-6 pr-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        ✕ Ineligible
                      </span>
                    </td>

                    {/* Bidder Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-500 dark:text-slate-400 line-through">
                        {bidder.name}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {bidder.id} • {bidder.pan}
                      </div>
                    </td>

                    {/* Quoted Price with Strikethrough */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="font-mono text-sm font-semibold text-slate-400 dark:text-slate-500 line-through">
                        {formatINR(bidder.quoteAmount)}
                      </div>
                      <div className="text-[10px] text-rose-500 font-medium">
                        Quote Null & Void
                      </div>
                    </td>

                    {/* MII & Technical */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        MII: <span className={isLowContent ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>{bidder.localContentPct}%</span>
                      </div>
                      <div className="text-[10px] text-rose-500 dark:text-rose-400">
                        {bidder.debarmentStatus}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        {bidder.aiScore}/100
                      </span>
                    </td>

                    {/* Final Disqualification Reason */}
                    //<td className="py-3.5 px-4 whitespace-nowrap">
                      {isPanMismatch ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <XCircle className="w-3.5 h-3.5" /> Ineligible — PAN Mismatch
                        </span>
                      ) : isLowContent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <XCircle className="w-3.5 h-3.5" /> Ineligible — Local Content &lt;50%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5" /> Ineligible — Action Pending
                        </span>
                      )}
                    </td>//

                    {/* Action */}
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => onInspectBidder(bidder)}
                        className="text-xs text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 font-semibold underline hover:no-underline"
                      >
                        View Flags
                      </button>
                    </td>
                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>

      {/* Award Modal */}
      <AwardModal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        tender={tender}
        l1Bidder={l1Bidder}
        totalSavings={totalSavings}
        jwtToken={jwtToken}
        isEvaluationFrozen={isEvaluationFrozen}
        onAwardSuccess={() => setIsEvaluationFrozen(true)}
      />
    </div>
  );
}

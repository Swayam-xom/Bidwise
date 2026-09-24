import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  X, 
  CheckCircle2, 
  Download, 
  FileCheck, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatINR } from '../../utils/formatters';

export default function AwardModal({ 
  isOpen, 
  onClose, 
  tender, 
  l1Bidder, 
  totalSavings,
  jwtToken = '',
  isEvaluationFrozen = false,
  onAwardSuccess
}) {
  if (!isOpen || !l1Bidder) return null;

  const [isAwarding, setIsAwarding] = useState(false);
  const [awardResult, setAwardResult] = useState(null);

  useEffect(() => {
    setAwardResult(null);
  }, [isOpen]);

  const handleAwardTender = async () => {
    setIsAwarding(true);
    setAwardResult(null);
    try {
      const tenderId = tender.id || 'GEM/2026/B/892101';
      const response = await fetch(`http://127.0.0.1:8000/api/tenders/${encodeURIComponent(tenderId)}/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {})
        },
        body: JSON.stringify({ bid_id: l1Bidder.id })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAwardResult({
          success: true,
          message: `Official GeM Award Order ratified. Tender ${data.tender_id} frozen and awarded to ${l1Bidder.name} (${data.awarded_bid_id}).`
        });
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {}
        if (onAwardSuccess) {
          onAwardSuccess(data);
        }
      } else {
        setAwardResult({
          success: false,
          message: data.detail || 'Failed to ratify tender award.'
        });
      }
    } catch (err) {
      setAwardResult({
        success: false,
        message: err.message || 'Network error communicating with procurement server.'
      });
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Banner */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl shadow-inner">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Official Procurement Decision
                </span>
                <span className="text-[10px] font-mono bg-emerald-400/20 px-2 py-0.5 rounded text-white border border-emerald-300/30 font-bold">
                  L1 RATIFIED
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                Tender Award & Evaluation Freeze
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10"
            aria-label="Close award modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Winner Showcase Card */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Awarded L1 Contractor
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                GST: {l1Bidder.gstin}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {l1Bidder.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {l1Bidder.legalName || l1Bidder.name}
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Contract Value</div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatINR(l1Bidder.quoteAmount)}
                </div>
              </div>
            </div>

            {/* Savings highlight */}
            <div className="pt-3 border-t border-emerald-200/80 dark:border-emerald-800/60 flex flex-wrap items-center justify-between text-xs text-emerald-900 dark:text-emerald-300">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Exchequer Savings vs Estimated Budget:
              </span>
              <strong className="font-extrabold text-emerald-800 dark:text-emerald-300 text-sm">
                +{formatINR(totalSavings)} ({((totalSavings / (tender.estimatedBudget || 60000000)) * 100).toFixed(1)}% Saved)
              </strong>
            </div>
          </div>

          {/* Statutory Summary */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[11px]">
              Statutory Ratification Checklist
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Make in India: <strong>{l1Bidder.localContentPct}%</strong></span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Compliance Score: <strong>{l1Bidder.aiScore}/100</strong></span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>PAN-GSTIN Status: <strong>Verified</strong></span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>GeM Debarment: <strong>Clear (0 Flags)</strong></span>
              </div>
            </div>
          </div>

          {/* Officer Certification Note */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Digital Signature Token: DSC-MeitY-DV-8921-2026
              </span>
              <span>{tender.evaluationDate || "08 Sep 2026"}</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Certified by <strong>{tender.officerInCharge}</strong>. The technical and financial evaluation is ratified for GeM Public Contract Register.
            </p>
          </div>

          {/* Award API Feedback */}
          {awardResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              awardResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              {awardResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">
                  {awardResult.success ? "Award Ratified & Recorded in SQLite" : "Procurement Award Rule Violation"}
                </div>
                <div className="text-[11px] mt-0.5 leading-relaxed">
                  {awardResult.message}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Close Window
          </button>

          <button
            onClick={handleAwardTender}
            disabled={isAwarding || isEvaluationFrozen || awardResult?.success}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50"
          >
            {isAwarding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Committing L1 Award...</span>
              </>
            ) : isEvaluationFrozen || awardResult?.success ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Evaluation Frozen (Award Ratified)</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Commit & Ratify L1 Award Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

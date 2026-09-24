import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  MinusCircle, 
  CheckCircle2, 
  HelpCircle,
  TrendingDown,
  FileBadge,
  BrainCircuit,
  Scale
} from 'lucide-react';
import { getScoreColor, THRESHOLD_QUALIFIED, THRESHOLD_CLARIFICATION } from '../../utils/formatters';

export default function RiskScoreGauge({ 
  score = null, 
  riskLevel = "Awaiting Evaluation", 
  deductions = [], 
  positiveHighlights = [] 
}) {
  const scoreStyle = getScoreColor(score);
  const hasScore = score !== null && score !== undefined;

  // SVG Gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const numericScore = hasScore ? Math.max(0, Math.min(100, score)) : 0;
  const strokeDashoffset = hasScore 
    ? circumference - (numericScore / 100) * circumference
    : circumference;

  const totalPenalty = deductions.reduce((acc, curr) => {
    if (typeof curr === 'object' && curr !== null) {
      return acc + (Number(curr.score) || 0);
    }
    return acc;
  }, 0);

  // Derive truthful statutory evaluation summary from actual deduction items (Task 2 & 3)
  const getTruthfulSummary = () => {
    if (!hasScore) {
      return {
        title: "Awaiting Technical Bid Dossier",
        desc: "Upload a technical bid PDF or select a demo preset to run automated statutory verification and risk analysis.",
        ruleBadge: "Pending"
      };
    }

    if (deductions.length === 0) {
      return {
        title: "All Statutory Requirements Verified",
        desc: "All statutory gates verified: PAN identity match, active GSTIN, Class-I local content (>=50%), and valid OEM authorization confirmed.",
        ruleBadge: "Passed (100%)"
      };
    }

    const hasPanError = deductions.some(d => {
      const cat = (typeof d === 'object' ? d.category : d) || '';
      const rsn = (typeof d === 'object' ? d.reason : '') || '';
      return cat.toLowerCase().includes('statutory') || cat.toLowerCase().includes('identity') || rsn.toLowerCase().includes('pan');
    });

    const hasMiiError = deductions.some(d => {
      const cat = (typeof d === 'object' ? d.category : d) || '';
      const rsn = (typeof d === 'object' ? d.reason : '') || '';
      return cat.toLowerCase().includes('make in india') || cat.toLowerCase().includes('local') || rsn.toLowerCase().includes('mii') || rsn.toLowerCase().includes('local content');
    });

    const hasEpfoError = deductions.some(d => {
      const cat = (typeof d === 'object' ? d.category : d) || '';
      const rsn = (typeof d === 'object' ? d.reason : '') || '';
      return cat.toLowerCase().includes('labor') || cat.toLowerCase().includes('social security') || rsn.toLowerCase().includes('epfo');
    });

    const issues = [];
    if (hasPanError) issues.push("PAN/GSTIN inconsistency flagged");
    if (hasMiiError) issues.push("MII declaration missing or <50% cutoff");
    if (hasEpfoError) issues.push("EPFO registration not identified");

    const issuesText = issues.length > 0 ? issues.join("; ") : `${deductions.length} statutory deduction(s) recorded`;

    if (numericScore >= THRESHOLD_QUALIFIED) {
      return {
        title: "Pre-Qualified with Rule Deductions",
        desc: `Overall score is ${numericScore}/100. Rule findings: ${issuesText}.`,
        ruleBadge: `${deductions.length} Deduction(s)`
      };
    } else if (numericScore >= THRESHOLD_CLARIFICATION) {
      return {
        title: "Clarification Required (48h Notice)",
        desc: `Statutory deductions detected: ${issuesText}. Requires officer clarification under GeM Rule 173.`,
        ruleBadge: `${deductions.length} Issue(s)`
      };
    } else {
      return {
        title: "Disqualified — Criteria Rejection",
        desc: `Critical statutory non-compliance: ${issuesText}. Failed mandatory procurement cutoff.`,
        ruleBadge: `${deductions.length} Violation(s)`
      };
    }
  };

  const summary = getTruthfulSummary();

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Compliance Score & Risk Assessment</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rule engine deduction breakdown & ML risk assessment
          </p>
        </div>

        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${scoreStyle.badge}`}>
          {riskLevel}
        </span>
      </div>

      {/* Gauge & Score Summary */}
      <div className="py-6 flex flex-col sm:flex-row items-center justify-center gap-8 border-b border-slate-100 dark:border-slate-800">
        {/* SVG Radial Gauge */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-100 dark:text-slate-800"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={!hasScore ? '#94A3B8' : numericScore >= THRESHOLD_QUALIFIED ? '#10B981' : numericScore >= THRESHOLD_CLARIFICATION ? '#F59E0B' : '#EF4444'}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {hasScore ? score : "—"}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {hasScore ? "/ 100" : "NO DOSSIER"}
            </span>
          </div>
        </div>

        {/* Gauge Insights & 3 Evaluation Pillars */}
        <div className="space-y-3 text-xs max-w-xs">
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {summary.title}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mt-1">
              {summary.desc}
            </p>
          </div>

          {/* Separation of ML / Rule / Decision Pillars */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                Rule Validation
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                {summary.ruleBadge}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                ML Risk Assessment
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                {hasScore ? riskLevel : "Ready for ML"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Deduction Breakdown */}
      <div className="flex-1 py-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MinusCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Statutory Rule Deductions ({deductions.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              Total penalty: {totalPenalty} pts
            </span>
          </div>

          {!hasScore ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>No deductions evaluated yet. Ingest a bid dossier to calculate penalties.</span>
            </div>
          ) : deductions.length === 0 ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Zero statutory deductions! Complete compliance achieved.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {deductions.map((item, idx) => {
                const isObj = typeof item === 'object' && item !== null;
                const category = isObj ? item.category : "Statutory Finding";
                const reason = isObj ? item.reason : item;
                const itemScore = isObj ? (item.score || 0) : 0;
                return (
                  <div 
                    key={idx} 
                    className="p-3 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-rose-900 dark:text-rose-200">{category}</div>
                      <div className="text-slate-600 dark:text-slate-400 text-[11px]">{reason}</div>
                    </div>
                    {itemScore !== 0 && (
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 shrink-0">
                        {itemScore} pts
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Positive Verification Highlights */}
        {positiveHighlights && positiveHighlights.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Positive Verifications ({positiveHighlights.length})</span>
            </h4>
            <div className="space-y-2">
              {positiveHighlights.map((hl, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{hl.title}</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">{hl.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

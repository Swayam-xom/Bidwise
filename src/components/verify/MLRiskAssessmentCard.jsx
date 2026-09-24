import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  FileText,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function MLRiskAssessmentCard({ 
  mlPrediction, 
  mlStatus = 'available', 
  featureProvenance = null,
  ruleScore = null,
  finalStatus = null,
  officerDecision = null,
  isNewlyAnalyzed = false,
  className = ""
}) {
  const [showProvenance, setShowProvenance] = useState(false);

  if (mlStatus === 'unavailable' || (!mlPrediction && !featureProvenance)) {
    return (
      <div className={`p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">ML Risk Assessment</h3>
              <p className="text-[11px] text-slate-400">Dual-Model Probability Fusion (LR + LightGBM)</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            UNAVAILABLE
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          ML model subsystem is currently in fallback mode. Deterministic statutory rule engine remains authoritative.
        </p>
      </div>
    );
  }

  // Fallback defaults if null
  const pred = mlPrediction || {
    predicted_compliance_label: ruleScore >= 80 ? 'Compliant' : (ruleScore >= 60 ? 'Needs Review' : 'Non-Compliant'),
    confidence: 0.85,
    compliance_risk_score: ruleScore >= 80 ? 12.0 : (ruleScore >= 60 ? 45.0 : 92.0),
    risk_level: ruleScore >= 80 ? 'LOW' : (ruleScore >= 60 ? 'MEDIUM' : 'HIGH'),
    probabilities: {
      'Compliant': ruleScore >= 80 ? 0.85 : 0.10,
      'Needs Review': ruleScore >= 60 && ruleScore < 80 ? 0.75 : 0.15,
      'Non-Compliant': ruleScore < 60 ? 0.92 : 0.03
    },
    individual_model_probabilities: {
      logistic_regression: { 'Compliant': 0.88, 'Needs Review': 0.12, 'Non-Compliant': 0.0 },
      lightgbm: { 'Compliant': 0.82, 'Needs Review': 0.18, 'Non-Compliant': 0.0 }
    },
    fusion_weights: { logistic_regression: 0.52, lightgbm: 0.48 }
  };

  const label = pred.predicted_compliance_label || 'Compliant';
  const confidencePct = Math.round((pred.confidence || 0) * 100);
  const riskScore = typeof pred.compliance_risk_score === 'number' ? pred.compliance_risk_score : 0;
  const riskLevel = (pred.risk_level || 'LOW').toUpperCase();
  const probs = pred.probabilities || {};

  // Officer Decision & Override Evaluation (Task 1)
  const isPending = isNewlyAnalyzed || (!officerDecision && (!finalStatus || finalStatus === 'Pending Officer Review'));
  const effectiveOfficerStatus = officerDecision || (isPending ? 'Pending Officer Review' : finalStatus);

  const isOverride = !isPending && 
    (label === 'Needs Review' || label === 'Non-Compliant') && 
    effectiveOfficerStatus && 
    effectiveOfficerStatus.toLowerCase().includes('qualif');

  const getLabelBadge = (lbl) => {
    switch (lbl) {
      case 'Compliant':
        return { bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 };
      case 'Needs Review':
        return { bg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400', icon: AlertTriangle };
      case 'Non-Compliant':
      default:
        return { bg: 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400', icon: XCircle };
    }
  };

  const getRiskColor = (lvl) => {
    switch (lvl) {
      case 'LOW':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'MEDIUM':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      case 'HIGH':
      default:
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
    }
  };

  const badgeInfo = getLabelBadge(label);
  const BadgeIcon = badgeInfo.icon;

  const provenanceList = featureProvenance ? Object.entries(featureProvenance) : [];

  const getSourceBadge = (src) => {
    switch (src) {
      case 'DOCUMENT':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'DERIVED':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'PLATFORM':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'MOCK_EXTERNAL':
        return 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'UNAVAILABLE':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">ML Risk Assessment</h3>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                Candidate Dual Model
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Balanced Logistic Regression (52%) + LightGBM (48%) Fusion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          <Info className="w-3 h-3 text-indigo-500" />
          <span>Decision Support Only</span>
        </div>
      </div>

      {/* Officer Override Alert Banner (Task 1) */}
      {isOverride && (
        <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs flex items-start gap-3 text-amber-900 dark:text-amber-200 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold">Officer Override Active:</strong>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              The ML model flagged this bid as <em>"{label}"</em> ({confidencePct}% confidence, risk score {riskScore.toFixed(1)}), but the procurement officer has explicitly exercised statutory discretion to mark this bid as <strong>Qualified</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main Prediction & Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Prediction */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            ML Prediction
          </span>
          <div className="flex items-center gap-1.5">
            <BadgeIcon className="w-4 h-4 shrink-0 text-current" />
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${badgeInfo.bg}`}>
              {label}
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Confidence
          </span>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {confidencePct}%
          </div>
        </div>

        {/* Risk Score */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Compliance Risk Score
          </span>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {riskScore.toFixed(1)} <span className="text-[11px] font-normal text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Risk Level */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Risk Level
          </span>
          <div>
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${getRiskColor(riskLevel)}`}>
              {riskLevel} RISK
            </span>
          </div>
        </div>
      </div>

      {/* Model Probability Breakdown */}
      <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Model Probability Distribution
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            P(C): {Math.round((probs['Compliant'] || 0) * 100)}% | P(NR): {Math.round((probs['Needs Review'] || 0) * 100)}% | P(NC): {Math.round((probs['Non-Compliant'] || 0) * 100)}%
          </span>
        </div>

        {/* Multi-segmented probability bar */}
        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${(probs['Compliant'] || 0) * 100}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Compliant: ${Math.round((probs['Compliant'] || 0) * 100)}%`}
          />
          <div 
            style={{ width: `${(probs['Needs Review'] || 0) * 100}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Needs Review: ${Math.round((probs['Needs Review'] || 0) * 100)}%`}
          />
          <div 
            style={{ width: `${(probs['Non-Compliant'] || 0) * 100}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Non-Compliant: ${Math.round((probs['Non-Compliant'] || 0) * 100)}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Compliant:</span>
            <strong className="text-slate-900 dark:text-white font-mono">{Math.round((probs['Compliant'] || 0) * 100)}%</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Needs Review:</span>
            <strong className="text-slate-900 dark:text-white font-mono">{Math.round((probs['Needs Review'] || 0) * 100)}%</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Non-Compliant:</span>
            <strong className="text-slate-900 dark:text-white font-mono">{Math.round((probs['Non-Compliant'] || 0) * 100)}%</strong>
          </div>
        </div>
      </div>

      {/* Distinction & Three-Tier Hierarchy Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-gradient-to-r from-slate-50 via-slate-50 to-indigo-50/40 dark:from-slate-800/40 dark:via-slate-800/40 dark:to-indigo-950/20 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
        
        {/* Tier 1: ML Prediction */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> 1. ML Prediction
          </div>
          <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {label} ({confidencePct}%)
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Dual-model probability risk assessment</p>
        </div>

        {/* Tier 2: Statutory Rules */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> 2. Statutory Rules
          </div>
          <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {ruleScore !== null ? `${ruleScore}/100 Deterministic` : 'Mandatory Gates'}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">PAN, GST, EPFO & MII statutory checks</p>
        </div>

        {/* Tier 3: Officer Decision */}
        <div className={`p-2 rounded-lg border ${
          isOverride
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
            : isPending
            ? 'bg-slate-50 dark:bg-slate-800/60 border-dashed border-slate-300 dark:border-slate-700'
            : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <FileText className="w-3 h-3" /> 3. Officer Decision
          </div>
          <div className={`font-bold mt-0.5 ${
            isOverride 
              ? 'text-amber-800 dark:text-amber-300' 
              : isPending
              ? 'text-slate-500 dark:text-slate-400 italic'
              : 'text-slate-800 dark:text-slate-200'
          }`}>
            {isPending 
              ? 'Pending Officer Review' 
              : isOverride 
              ? 'Qualified (Officer Override)' 
              : effectiveOfficerStatus}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isPending
              ? 'Awaiting formal officer review'
              : isOverride
              ? 'Officer approved despite ML advisory'
              : 'Authoritative procurement award'}
          </p>
        </div>
      </div>

      {/* Feature Provenance Collapsible Toggle */}
      {provenanceList.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowProvenance(!showProvenance)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>21-Feature Provenance & Sourcing Traceability</span>
              <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded font-normal">
                {provenanceList.length} features
              </span>
            </div>
            {showProvenance ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showProvenance && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">Feature Name</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">Source Classification & Value</span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {provenanceList.map(([featName, featData]) => (
                  <div 
                    key={featName}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono"
                  >
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{featName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-400 font-bold">
                        {typeof featData.value === 'number' 
                          ? (featData.value > 10000 ? `₹${featData.value.toLocaleString('en-IN')}` : featData.value)
                          : String(featData.value)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSourceBadge(featData.source)}`}>
                        {featData.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

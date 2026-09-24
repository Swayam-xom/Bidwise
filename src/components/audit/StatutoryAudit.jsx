import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock3, FileText, RefreshCw, Server } from 'lucide-react';

export default function StatutoryAudit({ bidders = [] }) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('Synchronized');

  const refreshChecks = () => {
    setRefreshing(true);
    setTimeout(() => { 
      setRefreshing(false); 
      setLastRefresh('Just now'); 
    }, 500);
  };

  const total = bidders.length;
  const checks = [
    { name: 'PAN Verification (MCA21)', passed: bidders.filter(b => /verified/i.test(b.panStatus || '')).length, desc: 'Identity and entity PAN structure match' },
    { name: 'GSTIN Verification (CBIC)', passed: bidders.filter(b => /active/i.test(b.gstStatus || '')).length, desc: 'GST active status and PAN matching digits 3-12' },
    { name: 'Make in India (MII) Declaration', passed: bidders.filter(b => Number(b.localContentPct ?? 0) >= 50).length, desc: 'Local content threshold >=50% certified by CA' },
    { name: 'Debarment & Vigilance Screening', passed: bidders.filter(b => /clear/i.test(b.debarmentStatus || '')).length, desc: 'Central debarment / blacklist screening' },
  ];
  const passed = checks.reduce((n, c) => n + c.passed, 0);
  const totalChecks = checks.length * (total > 0 ? total : 1);
  const coverage = total > 0 ? Math.round((passed / totalChecks) * 100) : 0;

  return (
    <section className="bidwise-page">
      <div className="bidwise-page-hero flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="bidwise-kicker">Statutory Audit Workspace</span>
          <h1>Statutory Compliance Audit</h1>
          <p>Review the statutory verification checks applied to every active bidder before commercial evaluation.</p>
        </div>
        <button 
          className="bidwise-soft-button flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" 
          onClick={refreshChecks} 
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> 
          <span>{refreshing ? "Refreshing Audit…" : "Refresh Checks"}</span>
        </button>
      </div>

      <div className="bidwise-audit-summary">
        <div className="bidwise-summary-card">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <strong>{coverage}%</strong>
            <span>Overall Coverage</span>
          </div>
        </div>
        <div className="bidwise-summary-card">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <strong>{passed}</strong>
            <span>Checks Passed</span>
          </div>
        </div>
        <div className="bidwise-summary-card">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <strong>{Math.max(0, totalChecks - passed)}</strong>
            <span>Items to Review</span>
          </div>
        </div>
        <div className="bidwise-summary-card">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Server size={20} />
          </div>
          <div>
            <strong>Demo Gateway</strong>
            <span>Mock Registry Mode</span>
          </div>
        </div>
      </div>

      <div className="bidwise-panel">
        <div className="bidwise-panel-heading">
          <div>
            <h2>Audit Controls & Gates</h2>
            <p>Statutory evidence coverage across {total} active bidder{total === 1 ? '' : 's'}.</p>
          </div>
          <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            ● Demo Gateway · {lastRefresh}
          </span>
        </div>
        <div className="bidwise-audit-list divide-y divide-slate-100 dark:divide-slate-800">
          {checks.map((check) => {
            const pct = total ? Math.round(check.passed / total * 100) : 0;
            return (
              <div className="bidwise-audit-row" key={check.name}>
                <div className="bidwise-audit-icon">
                  <ShieldCheck size={18} />
                </div>
                <div className="bidwise-audit-copy">
                  <strong>{check.name}</strong>
                  <span>{check.desc}</span>
                </div>
                <div className="bidwise-audit-progress">
                  <div>
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <b>{check.passed}/{total}</b>
                </div>
                <span className={pct === 100 ? 'bidwise-pill good' : 'bidwise-pill warn'}>
                  {pct === 100 ? 'Clear' : 'Review'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bidwise-info-card">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Audit Trail Integrity</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Every verification result is retained with its source, timestamp, and decision context for official procurement record keeping.
            </p>
          </div>
        </div>
        <div className="bidwise-info-card">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Exception Handling</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Flagged bidders remain visible to the officer until the underlying evidence is reviewed or the status decision is updated.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

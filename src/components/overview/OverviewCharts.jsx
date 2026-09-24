import React from 'react';
import { BarChart3, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

const STATUS = [
  { key: 'qualified', label: 'Qualified', tone: 'green', color: '#10b981' },
  { key: 'disqualified', label: 'Disqualified', tone: 'rose', color: '#ef4444' },
  { key: 'pending', label: 'Clarification', tone: 'amber', color: '#f59e0b' },
];

function DonutChart({ values, total }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const safeTotal = total > 0 ? total : 1;

  const segments = STATUS.map((item) => {
    const value = values[item.key] || 0;
    const length = total > 0 ? (value / safeTotal) * circumference : 0;
    const segment = { ...item, value, length, offset };
    offset += length;
    return segment;
  });

  return (
    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140" aria-label="Bidder status distribution">
        <circle 
          cx="70" 
          cy="70" 
          r={radius} 
          stroke="currentColor"
          strokeWidth="14"
          className="text-slate-100 dark:text-slate-800"
          fill="transparent"
        />
        {total > 0 && segments.map((segment) => (
          <circle
            key={segment.key}
            cx="70"
            cy="70"
            r={radius}
            stroke={segment.color}
            strokeWidth="14"
            fill="transparent"
            strokeDasharray={`${segment.length} ${circumference - segment.length}`}
            strokeDashoffset={-segment.offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <strong className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{total}</strong>
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Bidders</span>
      </div>
    </div>
  );
}

function CoverageBar({ label, value, total, color, icon: Icon }) {
  const safeTotal = total > 0 ? total : 1;
  const pct = total > 0 ? Math.round((value / safeTotal) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <Icon size={14} className="text-slate-400" />
          <span>{label}</span>
        </span>
        <strong className="font-mono font-bold text-slate-900 dark:text-slate-100">{pct}%</strong>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div 
          className={`h-full rounded-full ${color}`} 
          style={{ width: `${pct}%`, transition: 'width 0.4s ease' }} 
        />
      </div>
      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
        {value} of {total} bidders passed check
      </div>
    </div>
  );
}

export default function OverviewCharts({ bidders = [] }) {
  const total = bidders.length;
  const qualified = bidders.filter(b => (b.status || '').toUpperCase() === 'QUALIFIED').length;
  const disqualified = bidders.filter(b => (b.status || '').toUpperCase() === 'DISQUALIFIED').length;
  const pending = bidders.filter(b => (b.status || '').toUpperCase() === 'ACTION REQUIRED').length;

  const checks = [
    { label: 'PAN Identity Verified', value: bidders.filter(b => /verified/i.test(b.panStatus || '')).length, icon: ShieldCheck, color: 'bg-emerald-500' },
    { label: 'GSTIN Active Regular', value: bidders.filter(b => /active/i.test(b.gstStatus || '')).length, icon: CheckCircle2, color: 'bg-blue-500' },
    { label: 'MII >=50% Local Content', value: bidders.filter(b => Number(b.localContentPct ?? 0) >= 50).length, icon: BarChart3, color: 'bg-purple-500' },
    { label: 'Debarment Clear', value: bidders.filter(b => /clear/i.test(b.debarmentStatus || '')).length, icon: CheckCircle2, color: 'bg-teal-500' },
  ];

  const flagged = disqualified + pending;
  const safeTotal = total > 0 ? total : 1;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Donut Card */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Bidder Status Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current evaluation outcome across all submitted bids</p>
            </div>
          </div>

          <div className="py-6 flex flex-col sm:flex-row items-center justify-center gap-8">
            <DonutChart values={{ qualified, disqualified, pending }} total={total} />
            <div className="space-y-2.5 text-xs w-full max-w-xs">
              {STATUS.map(item => {
                const value = item.key === 'qualified' ? qualified : item.key === 'disqualified' ? disqualified : pending;
                const pct = Math.round((value / safeTotal) * 100);
                return (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800" key={item.key}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-slate-900 dark:text-white">{value}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 size={14} /> Eligible for L1 Ranking
            </span>
            <strong className="font-mono font-bold text-slate-900 dark:text-slate-100">{Math.round((qualified / safeTotal) * 100)}% Pass Rate</strong>
          </div>
        </div>

        {/* Verification Coverage Progress Card */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Statutory Verification Coverage</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Percentage of active bidder set passing each statutory gate</p>
            </div>
          </div>

          <div className="py-4 space-y-4">
            {checks.map(check => <CoverageBar key={check.label} {...check} total={total} />)}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
              <AlertTriangle size={14} /> Exceptions Under Review
            </span>
            <strong className="font-mono font-bold text-slate-900 dark:text-slate-100">{flagged} Flagged</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

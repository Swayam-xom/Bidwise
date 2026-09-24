import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  ShieldAlert, 
  Clock3, 
  ArrowRight
} from 'lucide-react';

export default function StatCards({ 
  totalCount = 0, 
  qualifiedCount = 0, 
  disqualifiedCount = 0, 
  pendingCount = 0,
  activeFilter,
  setActiveFilter 
}) {
  const qualifiedPct = totalCount > 0 ? Math.round((qualifiedCount / totalCount) * 100) : 0;
  const pendingPct = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const disqualifiedPct = totalCount > 0 ? Math.round((disqualifiedCount / totalCount) * 100) : 0;

  const cards = [
    {
      id: 'all',
      title: 'Total Submitted Bids',
      value: totalCount,
      subtext: 'Technical dossiers ingested for GeM tender',
      icon: Users,
      badge: totalCount > 0 ? '100% Ingested' : '0 Ingested',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      borderColor: activeFilter === 'all' 
        ? 'border-slate-800 dark:border-slate-400 ring-2 ring-slate-800/10 dark:ring-slate-400/20' 
        : 'border-slate-200 dark:border-slate-800',
      trend: 'Complete Roster',
    },
    {
      id: 'Qualified',
      title: 'Qualified',
      value: qualifiedCount,
      subtext: 'Passed all statutory, identity & MII checks',
      icon: CheckCircle2,
      badge: `${qualifiedPct}% Qualified`,
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      borderColor: activeFilter === 'Qualified' 
        ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-600/20' 
        : 'border-slate-200 dark:border-slate-800',
      trend: 'Eligible for L1 Opening',
    },
    {
      id: 'Action Required',
      title: 'Clarification Required',
      value: pendingCount,
      subtext: 'Pending 48h statutory / OEM endorsement',
      icon: Clock3,
      badge: `${pendingPct}% Action Pending`,
      badgeColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      borderColor: activeFilter === 'Action Required' 
        ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20' 
        : 'border-slate-200 dark:border-slate-800',
      trend: 'Rule 173 Clarification',
    },
    {
      id: 'Disqualified',
      title: 'Disqualified',
      value: disqualifiedCount,
      subtext: 'Failed statutory, identity, or MII <50%',
      icon: ShieldAlert,
      badge: `${disqualifiedPct}% Disqualified`,
      badgeColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
      iconBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
      borderColor: activeFilter === 'Disqualified' 
        ? 'border-rose-600 dark:border-rose-500 ring-2 ring-rose-600/20' 
        : 'border-slate-200 dark:border-slate-800',
      trend: 'Statutory Exclusion',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => setActiveFilter(isSelected ? 'all' : card.id)}
            className={`text-left bg-white dark:bg-slate-900/80 p-5 rounded-2xl border transition-all duration-200 hover:shadow-md relative overflow-hidden group ${card.borderColor}`}
          >
            {/* Ambient Background Gradient for active card */}
            {isSelected && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            )}

            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${card.iconBg} shadow-xs group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1 flex items-baseline gap-2">
                {card.value}
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                  {card.value === 1 ? 'bidder' : 'bidders'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {card.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate" title={card.subtext}>
                {card.subtext}
              </div>
            </div>

            {/* Bottom mini indicator */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-medium">
                {card.trend}
              </span>
              <span className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-medium">
                {isSelected ? '✓ Filter active' : 'Filter table →'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

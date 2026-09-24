import React from 'react';
import { BarChart3, ArrowLeft } from 'lucide-react';
import OverviewCharts from '../overview/OverviewCharts';

export default function AnalyticsPage({ bidders, onBack }) {
  return (
    <div className="bidwise-analytics-page space-y-6 animate-in fade-in duration-200">
      <div className="bidwise-page-hero flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="bidwise-kicker">Evaluation Intelligence</span>
          <h1>Compliance Analytics & Status Graphs</h1>
          <p>Visual evaluation metrics and statutory compliance breakdown for active tender submissions.</p>
        </div>
        <button 
          className="bidwise-soft-button flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" 
          onClick={onBack}
        >
          <ArrowLeft size={14} /> 
          <span>Back to Overview</span>
        </button>
      </div>
      <OverviewCharts bidders={bidders} />
    </div>
  );
}

import React, { useState } from 'react';
import { BookOpen, ChevronDown, CheckCircle2, IndianRupee, Scale, ShieldCheck } from 'lucide-react';

const rules = [
  ['Make in India (MII) Order', 'Class-I local suppliers must achieve >=50% local content verified by Practicing CA certificate. They are given purchase preference according to the tender clauses and latest DPIIT notifications.'],
  ['Statutory Identity Gates', 'PAN and GSTIN consistency (digits 3 to 12) is mandatory. Any entity linked to suspended GST status or mismatched PAN is automatically flagged for disqualification.'],
  ['MSME & EMD Exemptions', 'Valid Udyam registered Micro and Small Enterprises (MSEs) receive statutory exemptions from Earnest Money Deposit (EMD) and tender document fees.'],
  ['Commercial L1 Ranking Rule', 'Only bids that clear all mandatory technical specifications, Make in India local content thresholds, and statutory gates proceed to the commercial L1 price matrix opening.'],
  ['Debarment & Vigilance Screening', 'Bidders are screened against Central Vigilance Commission (CVC), GeM central debarment, and CPPP watchlists before final recommendation.'],
];

export default function ProcurementRules() {
  const [open, setOpen] = useState(0);

  return (
    <section className="bidwise-page">
      <div className="bidwise-page-hero flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="bidwise-kicker">Policy Intelligence</span>
          <h1>Public Procurement Rules & Guidelines</h1>
          <p>Official reference for Make in India (MII), statutory eligibility gates, and transparent L1 tender evaluation.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
          <Scale size={16} /> 
          <span>MII Policy Guide</span>
        </div>
      </div>

      <div className="bidwise-rule-cards">
        <div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <IndianRupee size={18} />
          </div>
          <div>
            <strong>Fair Commercials</strong>
            <span>Equal tender evaluation terms for every compliant vendor.</span>
          </div>
        </div>
        <div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <strong>Compliance First</strong>
            <span>Statutory identity and technical gates strictly precede L1 price comparison.</span>
          </div>
        </div>
        <div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <strong>Evidence Based</strong>
            <span>Every qualification decision is anchored to verifiable dossier evidence.</span>
          </div>
        </div>
      </div>

      <div className="bidwise-panel">
        <div className="bidwise-panel-heading">
          <div>
            <h2>Rules & Statutory Evaluation Principles</h2>
            <p>Expand a section to review statutory guidance and policy references.</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {rules.map(([title, body], i) => (
            <div className="bidwise-rule" key={title}>
              <button onClick={() => setOpen(open === i ? -1 : i)}>
                <span className="flex items-center gap-2.5 font-bold text-xs text-slate-900 dark:text-slate-100">
                  <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" />
                  {title}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="bidwise-rule-body">
                  {body}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bidwise-rule-note">
        <strong>Important Disclaimer:</strong> This workspace operates as an intelligent evaluation layer. Official procurement awards must comply with the latest applicable Government of India orders, DPIIT notifications, and specific tender conditions.
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { Settings, Save, RotateCcw, ShieldCheck, BrainCircuit, Zap, Bell, CheckCircle2 } from 'lucide-react';

export const DEFAULTS = { ai: true, statutory: true, mii: true, alerts: true, autoRefresh: true };

export function getEngineSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('bidwise_engine_settings') || '{}') };
  } catch {
    return DEFAULTS;
  }
}

export default function EngineSettings() {
  const [settings, setSettings] = useState(() => getEngineSettings());
  const [saved, setSaved] = useState(false);

  const toggle = key => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const save = () => { 
    localStorage.setItem('bidwise_engine_settings', JSON.stringify(settings)); 
    setSaved(true); 
    setTimeout(() => setSaved(false), 1800); 
  };
  const reset = () => setSettings(DEFAULTS);

  const rows = [
    ['ai', 'AI Document Extraction', 'OCR parsing, risk scoring and anomaly detection rules.', BrainCircuit],
    ['statutory', 'Statutory Verification Gateway', 'PAN, GSTIN, and central debarment cross-checks.', ShieldCheck],
    ['mii', 'Make in India Rules (>=50%)', 'Enforce the configured Class-I local-content threshold.', CheckCircle2],
    ['alerts', 'Compliance Alerts', 'Show pending clarifications and risk notifications.', Bell],
    ['autoRefresh', 'Live Evaluation Refresh', 'Refresh bidder metrics when new API data arrives.', Zap],
  ];

  return (
    <div className="bidwise-settings-page space-y-6 animate-in fade-in duration-200">
      <div className="bidwise-page-hero flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="bidwise-kicker">System Configuration</span>
          <h1>Engine Settings & Verification Gates</h1>
          <p>Configure the verification engines and statutory rules applied to this tender workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="bidwise-soft-button flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" 
            onClick={reset}
          >
            <RotateCcw size={14} /> 
            <span>Reset Defaults</span>
          </button>
          <button 
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all" 
            onClick={save}
          >
            <Save size={14} /> 
            <span>{saved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bidwise-panel">
          <div className="bidwise-panel-heading">
            <div>
              <h2>Verification Modules</h2>
              <p>Toggle individual engines on or off for this evaluation session.</p>
            </div>
          </div>
          <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map(([key, title, desc, Icon]) => (
              <div className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1" key={key}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon size={17} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>
                  </div>
                </div>
                <button 
                  aria-label={`Toggle ${title}`} 
                  className={`bidwise-toggle ${settings[key] ? 'on' : ''}`} 
                  onClick={() => toggle(key)}
                >
                  <span />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bidwise-panel">
          <div className="bidwise-panel-heading">
            <div>
              <h2>Engine Status</h2>
              <p>Current session configuration.</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <strong className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">Evaluation Engine Active</strong>
                <small className="text-[10px] text-emerald-700 dark:text-emerald-400">Configuration stored locally in browser session.</small>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <span>Enabled Modules</span>
                <strong className="text-slate-900 dark:text-white font-mono">{Object.values(settings).filter(Boolean).length}/5</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <span>Session Security</span>
                <strong className="text-slate-900 dark:text-white font-mono">JWT / HS256</strong>
              </div>
              <div className="flex justify-between py-2 text-slate-600 dark:text-slate-400">
                <span>Evaluation Mode</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">GeM Integrated Layer</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

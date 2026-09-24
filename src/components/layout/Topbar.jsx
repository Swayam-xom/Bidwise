import React, { useState } from 'react';
import {
  Search,
  UploadCloud,
  Bell,
  Calendar,
  FileCheck2,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  X,
  LockKeyhole,
  ChevronDown,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function Topbar({ 
  onUploadClick, 
  searchQuery, 
  setSearchQuery, 
  tender, 
  jwtToken = '', 
  theme = 'dark', 
  onToggleTheme 
}) {
  const [showAlerts, setShowAlerts] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToken = async () => {
    if (!jwtToken) return;
    try {
      await navigator.clipboard.writeText(jwtToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const tenderId = tender?.id || "GEM/2026/B/892101";
  const tokenPreview = jwtToken
    ? `${jwtToken.slice(0, 20)}…${jwtToken.slice(-16)}`
    : 'Session Token (Ready)';

  return (
    <header className="bidwise-topbar">
      {/* GeM Tender Context Header */}
      <div className="bidwise-topbar-tender">
        <div className="bidwise-topbar-gem" title="Government e-Marketplace">
          GeM
        </div>
        <div className="bidwise-topbar-tender-copy">
          <div className="bidwise-topbar-eyebrow">
            <span className="bidwise-gem-badge">GeM Tender</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
              Tender ID: {tenderId}
            </span>
            <span className="hidden sm:inline-block text-slate-400 dark:text-slate-500">•</span>
            <span className="hidden sm:inline-block font-semibold text-emerald-700 dark:text-emerald-400">
              Technical Bid Compliance Evaluation
            </span>
          </div>

          <div className="bidwise-topbar-title-row">
            <button 
              className="bidwise-tender-token-button" 
              onClick={() => setShowToken(v => !v)} 
              title="View Secure Tender Session details"
            >
              <LockKeyhole size={11} className="text-emerald-600 dark:text-emerald-400" />
              <span>Secure Tender Session</span>
              <ChevronDown size={11} className={`transition-transform ${showToken ? 'rotate-180' : ''}`} />
            </button>
            <span className="bidwise-live-dot" />
            <span className="bidwise-live-label">Compliance & L1 Evaluation Layer</span>
          </div>

          <div className="bidwise-topbar-subtitle" title={tender.title}>
            {tender.title} — {tender.authority}
          </div>
        </div>
      </div>

      {/* Topbar Actions */}
      <div className="bidwise-topbar-actions">
        {/* Search */}
        <div className="bidwise-topbar-search">
          <Search size={14} />
          <input
            aria-label="Search bidders, PAN, GSTIN"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bidders, PAN, GSTIN…"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
          <kbd>⌘K</kbd>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="bidwise-theme-toggle"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} className="text-amber-400" />
              <span className="hidden md:inline text-[11px] text-slate-200 font-semibold">Light</span>
            </>
          ) : (
            <>
              <Moon size={15} className="text-slate-700" />
              <span className="hidden md:inline text-[11px] text-slate-700 font-semibold">Dark</span>
            </>
          )}
        </button>

        {/* Alerts Bell */}
        <button
          className={`bidwise-icon-button ${showAlerts ? 'active' : ''}`}
          title="Evaluation alerts"
          onClick={() => setShowAlerts(v => !v)}
          aria-label="Evaluation alerts"
        >
          <Bell size={16} />
          <span className="bidwise-notification-dot" />
        </button>

        {/* Upload Dossier Button */}
        <button className="bidwise-topbar-upload" onClick={onUploadClick}>
          <UploadCloud size={15} />
          <span>Upload Dossier</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Token Popover */}
      {showToken && (
        <div className="bidwise-token-popover">
          <div className="bidwise-popover-head">
            <div>
              <LockKeyhole size={14} className="text-emerald-600 dark:text-emerald-400" />
              <strong>Secure GeM Evaluation Session</strong>
            </div>
            <button onClick={() => setShowToken(false)} aria-label="Close">
              <X size={14} />
            </button>
          </div>
          <div className="bidwise-token-meta flex justify-between mt-2 text-[10px] text-slate-500 dark:text-slate-400">
            <span>Tender Target</span>
            <strong className="font-mono text-slate-800 dark:text-slate-200">{tenderId}</strong>
          </div>
          <div className="bidwise-token-meta flex justify-between mt-1 text-[10px] text-slate-500 dark:text-slate-400">
            <span>Authentication</span>
            <strong className="font-mono text-slate-800 dark:text-slate-200">JWT / HS256 Signed</strong>
          </div>
          <div className="bidwise-token-box">
            {jwtToken || 'JWT-TENDER-SESSION-DEV-8921-2026-ACTIVE'}
          </div>
          <div className="bidwise-token-actions">
            <span>{jwtToken ? 'HS256 access token active' : 'Local demo evaluation mode'}</span>
            <button disabled={!jwtToken} onClick={copyToken}>
              {copied ? <Check size={12} /> : <Copy size={12} />} 
              {copied ? 'Copied' : 'Copy Token'}
            </button>
          </div>
        </div>
      )}

      {/* Alerts Popover */}
      {showAlerts && (
        <div className="bidwise-alert-popover">
          <div className="bidwise-popover-head">
            <div>
              <Bell size={14} className="text-amber-500" />
              <strong>Evaluation Alerts & Flags</strong>
            </div>
            <button onClick={() => setShowAlerts(false)} aria-label="Close">
              <X size={14} />
            </button>
          </div>
          <div className="bidwise-alert-item">
            <span className="alert-icon amber"><Calendar size={14} /></span>
            <div>
              <strong>1 Clarification Pending</strong>
              <small>OEM endorsement requires 48h officer verification review.</small>
            </div>
          </div>
          <div className="bidwise-alert-item">
            <span className="alert-icon rose"><ShieldAlert size={14} /></span>
            <div>
              <strong>3 Bidders Flagged</strong>
              <small>Statutory PAN/GSTIN inconsistencies or &lt;50% MII local content.</small>
            </div>
          </div>
          <div className="bidwise-alert-item">
            <span className="alert-icon green"><FileCheck2 size={14} /></span>
            <div>
              <strong>8 Bidders Qualified</strong>
              <small>Cleared for final L1 financial matrix evaluation.</small>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

import React, { useState } from 'react';
import { 
  LockKeyhole, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Mail, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Layers,
  FileCheck2,
  Server
} from 'lucide-react';

export default function LoginScreen({ onLogin, theme = 'dark', onToggleTheme }) {
  const [email, setEmail] = useState('officer@bidwise.gov.in');
  const [password, setPassword] = useState('officer2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('procurement_officer');

  const presetRoles = [
    { id: 'procurement_officer', label: 'Procurement Officer', email: 'officer@bidwise.gov.in', dept: 'MeitY / GeM' },
    
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id);
    setEmail(role.email);
    setPassword('officer2026');
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim() || password.length < 4) {
      setError('Please enter an authorized officer email and at least a 4-character passcode.');
      return;
    }
    onLogin({ email: email.trim(), role: selectedRole });
  };

  return (
    <div className="bidwise-login-screen">
      {/* Ambient background glows */}
      <div className="bidwise-login-glow bidwise-login-glow-1" />
      <div className="bidwise-login-glow bidwise-login-glow-2" />
      <div className="bidwise-login-grid-pattern" />

      {/* Top Bar on Login Page */}
      <header className="bidwise-login-header">
        <div className="flex items-center gap-3">
          <div className="bidwise-login-gem-badge">GeM</div>
          <div>
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Government of India
            </div>
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              Procurement Evaluation Layer
            </div>
          </div>
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="bidwise-theme-toggle"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            type="button"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} className="text-amber-400" />
                <span className="text-[11px] text-slate-200 font-semibold">Light</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-slate-700" />
                <span className="text-[11px] text-slate-700 font-semibold">Dark</span>
              </>
            )}
          </button>
        )}
      </header>

      {/* Main Login Card */}
      <div className="bidwise-login-card">
        {/* Brand Header */}
        <div className="bidwise-login-brand">
          <div className="bidwise-login-logo">
            <Sparkles size={22} />
          </div>
          <div>
            <strong>Bid<span>wise</span></strong>
            <small>AI-Powered GeM Compliance Platform</small>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="bidwise-login-heading">
          <span>
            <LockKeyhole size={13} /> Official Officer Sign In
          </span>
          <h1>Evaluation Workspace</h1>
          <p>Sign in to evaluate active GeM technical bids, audit statutory compliance, and review L1 pricing.</p>
        </div>

        {/* Preset Officer Quick-Select */}
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center justify-between">
           
          </div>
          <div className="grid grid-cols-3 gap-2">
            {presetRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`p-2 rounded-xl border text-left transition-all ${
                  selectedRole === role.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-[10px] truncate leading-tight">{role.label}</div>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{role.dept}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={submit}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400" />
              <span>Official Email Address</span>
            </label>
            <input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              type="email" 
              placeholder="officer@bidwise.gov.in"
              required
              className="w-full h-11 px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5 mt-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <LockKeyhole size={13} className="text-slate-400" />
                <span>Security Passcode</span>
              </span>
              
            </label>
            <div className="relative">
              <input 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter password"
                required
                className="w-full h-11 pl-3.5 pr-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bidwise-login-error mt-3">
              {error}
            </div>
          )}

          <button className="bidwise-login-button mt-4" type="submit">
            <span>Sign In to Evaluation Layer</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Security / Compliance Badges */}
        <div className="bidwise-login-security">
          <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>JWT-secured GeM Evaluation Session</span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <span>Active Tender: GEM/2026/B/892101</span>
          
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  Search, 
  RefreshCw,
  Info,
  Server
} from 'lucide-react';

export default function MockRegistry({ bidders = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed('Just now');
    }, 500);
  };

  const filteredBidders = bidders.filter((b) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.pan && b.pan.toLowerCase().includes(q)) ||
      (b.gstin && b.gstin.toLowerCase().includes(q)) ||
      (b.udyam && b.udyam.toLowerCase().includes(q))
    );
  });

  const registryCards = [
    {
      name: "Income Tax & MCA21",
      code: "PAN Verification Gateway",
      icon: Building2,
      status: "Demo Connector",
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
      description: "Validates 10-character PAN format and corporate entity status via mock connector.",
      verifiedCount: bidders.filter(b => (b.panStatus || '').toLowerCase().includes('verified')).length,
    },
    {
      name: "CBIC GSTN Portal",
      code: "GSTIN Verification Gateway",
      icon: ShieldCheck,
      status: "Demo Connector",
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
      description: "Cross-checks 15-digit GSTIN active filing status and entity PAN match via simulated gateway.",
      verifiedCount: bidders.filter(b => (b.gstStatus || '').toLowerCase().includes('active')).length,
    },
    {
      name: "Udyam MSME Portal",
      code: "MSME Classification Portal",
      icon: Database,
      status: "Demo Connector",
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
      description: "Confirms Micro/Small/Medium enterprise registration and EMD exemption status.",
      verifiedCount: bidders.filter(b => Boolean(b.udyam && b.udyam !== 'N/A')).length,
    },
    {
      name: "Central Debarment List",
      code: "GeM / CPPP Watchlist",
      icon: AlertTriangle,
      status: "Demo Connector",
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
      description: "Screens supplier against central debarment, vigilance and integrity watchlists.",
      verifiedCount: bidders.filter(b => (b.debarmentStatus || '').toLowerCase().includes('clear')).length,
    },
  ];

  return (
    <section className="bidwise-page space-y-6 animate-in fade-in duration-200">
      {/* Page Hero */}
      <div className="bidwise-page-hero flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="bidwise-kicker">
            Demo / Mock Registry Gateway
          </span>
          <h1>
            GeM & MCA Statutory Registry Gateway
          </h1>
          <p>
            Simulated registry connector for PAN, GSTIN, Udyam MSME, and Central Vigilance / Debarment watchlists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="bidwise-soft-button flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Checking Registries..." : "Sync Mock Registries"}</span>
          </button>
        </div>
      </div>

      {/* Prominent Demo Disclaimer Banner (TASK 8) */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong>Demo / Mock Registry Mode:</strong> All statutory cross-checks operate via simulated mock connectors with verified test datasets. No live production government API calls (CBIC, MCA21, DigiLocker) are initiated during this evaluation.
        </div>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {registryCards.map((gateway) => {
          const Icon = gateway.icon;
          return (
            <div key={gateway.code} className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${gateway.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Demo Connector
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{gateway.name}</h3>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{gateway.code}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {gateway.description}
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Verified Bidders:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{gateway.verifiedCount} / {bidders.length}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bidders Verification Table in Mock Registry */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bidder Registry Records</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Simulated gateway status across active tender submissions.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by Name, PAN, GSTIN..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {filteredBidders.length} records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Bidder Entity</th>
                <th className="py-3 px-4">PAN (MCA21)</th>
                <th className="py-3 px-4">GSTIN (CBIC)</th>
                <th className="py-3 px-4">Udyam Registration</th>
                <th className="py-3 px-4">Debarment Status</th>
                <th className="py-3 px-4 text-right">Gateway Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredBidders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No matching bidder records found in mock registry.
                  </td>
                </tr>
              ) : (
                filteredBidders.map((b) => {
                  const isPanValid = (b.panStatus || '').toLowerCase().includes('verified');
                  const isGstActive = (b.gstStatus || '').toLowerCase().includes('active');
                  const isClear = (b.debarmentStatus || '').toLowerCase().includes('clear');
                  const isUdyam = Boolean(b.udyam && b.udyam !== 'N/A');

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{b.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{b.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700 dark:text-slate-300">{b.pan || 'N/A'}</div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${isPanValid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isPanValid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {b.panStatus || 'Verified'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700 dark:text-slate-300">{b.gstin || 'N/A'}</div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${isGstActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isGstActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {b.gstStatus || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {isUdyam ? (
                          <div>
                            <div>{b.udyam}</div>
                            <span className="text-[10px] text-purple-700 dark:text-purple-400 font-sans font-medium">{b.msmeType || 'MSME Verified'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Not Declared</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${isClear ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                          {isClear ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3 text-rose-500" />}
                          {b.debarmentStatus || 'Clear'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <Server className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Mocked · 200 OK</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

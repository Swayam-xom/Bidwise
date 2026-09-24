import React, { useState } from 'react';
import { 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowUpDown, 
  FileSearch, 
  Search, 
  ChevronRight,
  Trophy,
  UploadCloud,
  FolderOpen
} from 'lucide-react';
import { formatINR, getScoreColor, getStatusBadge } from '../../utils/formatters';

export default function BiddersTable({ 
  bidders = [], 
  onInspectBidder, 
  filterStatus, 
  setFilterStatus, 
  searchQuery,
  onOpenSubmitModal 
}) {
  const [sortBy, setSortBy] = useState('price'); // 'score' | 'price' | 'name'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Determine L1 Winner: lowest quote among QUALIFIED bidders
  const qualifiedBidders = bidders.filter(b => (b.status || '').toUpperCase() === 'QUALIFIED');
  const l1Winner = qualifiedBidders.length > 0 
    ? [...qualifiedBidders].sort((a, b) => a.quoteAmount - b.quoteAmount)[0] 
    : null;

  // Filtering
  const filteredBidders = bidders.filter((bidder) => {
    // Status filter
    if (filterStatus !== 'all') {
      const bStatus = (bidder.status || '').toUpperCase();
      const fStatus = filterStatus.toUpperCase();
      if (bStatus !== fStatus) return false;
    }
    // Search query
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        (bidder.name && bidder.name.toLowerCase().includes(q)) ||
        (bidder.legalName && bidder.legalName.toLowerCase().includes(q)) ||
        (bidder.pan && bidder.pan.toLowerCase().includes(q)) ||
        (bidder.gstin && bidder.gstin.toLowerCase().includes(q)) ||
        (bidder.id && bidder.id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sorting
  const sortedBidders = [...filteredBidders].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'score') {
      comp = (a.aiScore || 0) - (b.aiScore || 0);
    } else if (sortBy === 'price') {
      comp = (a.quoteAmount || 0) - (b.quoteAmount || 0);
    } else if (sortBy === 'name') {
      comp = (a.name || '').localeCompare(b.name || '');
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder(type === 'price' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-[#D0D5DD] dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Table Header & Controls Bar */}
      <div className="p-4 border-b border-[#D0D5DD] dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-[#F8FAFC] dark:bg-slate-900/50">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-medium">
          {[
            { id: 'all', label: 'All Bidders', count: bidders.length },
            { id: 'Qualified', label: 'Qualified', count: bidders.filter(b => (b.status || '').toUpperCase() === 'QUALIFIED').length },
            { id: 'Action Required', label: 'Clarification', count: bidders.filter(b => (b.status || '').toUpperCase() === 'ACTION REQUIRED').length },
            { id: 'Disqualified', label: 'Disqualified', count: bidders.filter(b => (b.status || '').toUpperCase() === 'DISQUALIFIED').length },
          ].map((tab) => {
            const isActive = filterStatus.toLowerCase() === tab.id.toLowerCase();
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-white dark:bg-slate-700 text-[#101828] dark:text-white shadow-xs border border-[#D0D5DD] dark:border-slate-600' 
                    : 'text-[#475467] dark:text-slate-400 hover:text-[#101828] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive 
                    ? 'bg-[#EEF2F6] dark:bg-slate-800 text-[#101828] dark:text-slate-200' 
                    : 'bg-slate-300/60 dark:bg-slate-800 text-[#475467] dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Sorting Info */}
        <div className="flex items-center gap-3 text-xs text-[#667085] dark:text-slate-400">
          <span>
            Showing <strong className="text-[#101828] dark:text-slate-200">{sortedBidders.length}</strong> of {bidders.length} bids
          </span>
          <div className="h-4 w-px bg-[#D0D5DD] dark:bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-[#667085] dark:text-slate-500">Sort:</span>
            <button 
              onClick={() => handleSort('price')}
              className={`px-2 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 border transition-colors ${
                sortBy === 'price' 
                  ? 'bg-[#DDF7EE] dark:bg-emerald-950/40 border-[#8ED8C1] dark:border-emerald-700 text-[#087F5B] dark:text-emerald-300' 
                  : 'bg-white dark:bg-slate-800 border-[#D0D5DD] dark:border-slate-700 text-[#344054] dark:text-slate-300'
              }`}
            >
              Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              onClick={() => handleSort('score')}
              className={`px-2 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 border transition-colors ${
                sortBy === 'score' 
                  ? 'bg-[#DDF7EE] dark:bg-emerald-950/40 border-[#8ED8C1] dark:border-emerald-700 text-[#087F5B] dark:text-emerald-300' 
                  : 'bg-white dark:bg-slate-800 border-[#D0D5DD] dark:border-slate-700 text-[#344054] dark:text-slate-300'
              }`}
            >
              Score {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D0D5DD] dark:border-slate-800 bg-[#344054] dark:bg-slate-900/90 text-[11px] font-bold uppercase tracking-wider text-white dark:text-slate-300 select-none">
              <th className="py-3.5 pl-6 pr-4 text-white">Bidder Entity</th>
              <th className="py-3.5 px-4 text-right text-white">Quoted Amount</th>
              <th className="py-3.5 px-4 text-white">Statutory / Rule Validation</th>
              <th className="py-3.5 px-4 text-white">ML Compliance Score</th>
              <th className="py-3.5 px-4 text-white">Final Decision</th>
              <th className="py-3.5 pl-4 pr-6 text-right text-white">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D0D5DD] dark:divide-slate-800/80 text-xs bg-white dark:bg-transparent">
            {/* Empty State */}
            {bidders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                      No bids submitted yet
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Upload a bid dossier to begin compliance verification.
                    </p>
                    {onOpenSubmitModal && (
                      <button
                        onClick={onOpenSubmitModal}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#008F6C] hover:bg-[#006B52] text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Bid Dossier</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : sortedBidders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <FileSearch className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">No bids match active filter.</p>
                  <p className="text-[11px]">Select "All Bidders" or clear the search query.</p>
                </td>
              </tr>
            ) : (
              sortedBidders.map((bidder) => {
                const score = bidder.aiScore ?? 0;
                const scoreStyle = getScoreColor(score);
                const rawStatus = (bidder.status || '').toUpperCase();
                const isQualified = rawStatus === 'QUALIFIED';
                const isDisqualified = rawStatus === 'DISQUALIFIED';
                const isClarification = !isQualified && !isDisqualified;
                const isPanVerified = (bidder.panStatus || '').toLowerCase().includes('verified');
                const isGstActive = (bidder.gstStatus || '').toLowerCase().includes('active');
                const isMiiClass1 = (bidder.localContentPct || 0) >= 50;
                
                // Authoritative L1 constraint: L1 can ONLY be assigned to lowest quoted QUALIFIED bidder
                const isCrownWinner = isQualified && Boolean(l1Winner && l1Winner.id === bidder.id);

                return (
                  <tr 
                    key={bidder.id}
                    className={`transition-colors group cursor-pointer ${
                      isCrownWinner 
                        ? 'bg-[#F0FDF9] dark:bg-emerald-950/25 hover:bg-[#E6F9F3] dark:hover:bg-emerald-950/40' 
                        : isClarification
                          ? 'bg-[#FFFBEB] dark:bg-amber-950/20 hover:bg-[#FEF3C7]/60 dark:hover:bg-amber-950/30'
                          : 'bg-white dark:bg-transparent hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40'
                    }`}
                    onClick={() => onInspectBidder(bidder)}
                  >
                    {/* 1. Bidder Details */}
                    <td className="py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isCrownWinner 
                            ? 'bg-[#008F6C] text-white shadow-xs' 
                            : 'bg-slate-100 dark:bg-slate-800 border border-[#D0D5DD] dark:border-slate-700 text-[#344054] dark:text-slate-300 group-hover:bg-[#E8F7F2] dark:group-hover:bg-emerald-950/30 group-hover:text-[#087F5B]'
                        }`}>
                          {isCrownWinner ? '🏆' : (bidder.name || 'BD').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#101828] dark:text-slate-100 flex items-center gap-1.5 group-hover:text-[#008F6C] dark:group-hover:text-emerald-400 transition-colors">
                            <span>{bidder.name}</span>
                            {isCrownWinner && (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#008F6C] text-white px-2 py-0.5 rounded-full shadow-xs">
                                🏆 L1
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#667085] dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span>{bidder.id}</span>
                            <span>•</span>
                            <span className="truncate max-w-[150px] font-sans">{bidder.msmeType || "Supplier"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Quoted Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className={`font-extrabold text-sm ${isCrownWinner ? 'text-[#087F5B] dark:text-emerald-400 text-base' : 'text-[#101828] dark:text-slate-100'}`}>
                        {formatINR(bidder.quoteAmount)}
                      </div>
                      <div className="text-[10px] text-[#667085] dark:text-slate-400 font-medium">
                        (₹{Math.round((bidder.quoteAmount || 0) / 500).toLocaleString('en-IN')} / unit)
                      </div>
                    </td>

                    {/* 3. Statutory / Rule Validation */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {/* Statutory Identifiers Line */}
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-[10px] font-mono font-semibold text-[#667085] dark:text-slate-400">PAN:</span>
                          <span className="font-mono font-bold text-[#1D2939] dark:text-slate-200">{bidder.pan || "N/A"}</span>
                          {isPanVerified ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-[#087F5B] dark:text-emerald-400 bg-[#DDF7EE] dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-[#8ED8C1] dark:border-emerald-800">
                              ✓ Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold text-[#B4233D] dark:text-rose-400 bg-[#FDE7EA] dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-[#F1A3AE] dark:border-rose-800">
                              ✕ Mismatch
                            </span>
                          )}
                        </div>

                        {/* MII Rule Line */}
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-[10px] font-mono font-semibold text-[#667085] dark:text-slate-400">MII:</span>
                          <span className="font-mono font-bold text-[#1D2939] dark:text-slate-200">{bidder.localContentPct || 0}%</span>
                          {isMiiClass1 ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-[#087F5B] dark:text-emerald-400 bg-[#DDF7EE] dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-[#8ED8C1] dark:border-emerald-800">
                              Class-I Local
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold text-[#B4233D] dark:text-rose-400 bg-[#FDE7EA] dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-[#F1A3AE] dark:border-rose-800">
                              &lt;50% Mandate
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 4. ML Compliance Score */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs border shadow-xs ${scoreStyle.badge}`}>
                          {score}/100
                        </span>
                        <div className="text-[10px] text-[#667085] dark:text-slate-400 font-medium">
                          {score >= 80 ? (
                            <span className="text-[#087F5B] dark:text-emerald-400 font-bold">ML Pass</span>
                          ) : score >= 60 ? (
                            <span className="text-[#B45309] dark:text-amber-400 font-bold">ML Review</span>
                          ) : (
                            <span className="text-[#B4233D] dark:text-rose-400 font-bold">ML High Risk</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 5. Final Decision */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isQualified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DDF7EE] dark:bg-emerald-950/50 text-[#087F5B] dark:text-emerald-300 border border-[#8ED8C1] dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
                          Qualified
                        </span>
                      ) : isDisqualified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDE7EA] dark:bg-rose-950/50 text-[#B4233D] dark:text-rose-300 border border-[#F1A3AE] dark:border-rose-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B4233D]" />
                          Disqualified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF4DB] dark:bg-amber-950/50 text-[#B45309] dark:text-amber-300 border border-[#F2C46D] dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
                          Clarification
                        </span>
                      )}
                    </td>

                    {/* 6. Action Button */}
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectBidder(bidder);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#E8F7F2] dark:hover:bg-emerald-950/40 text-[#344054] dark:text-slate-200 hover:text-[#087F5B] dark:hover:text-emerald-400 border border-[#D0D5DD] dark:border-slate-700 hover:border-[#8ED8C1] dark:hover:border-emerald-700 font-semibold text-xs transition-all shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#667085] dark:text-slate-500 group-hover:text-[#008F6C] dark:group-hover:text-emerald-400" />
                        <span>Inspect Dossier</span>
                        <ChevronRight className="w-3 h-3 text-[#667085] dark:text-slate-500 group-hover:text-[#008F6C] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

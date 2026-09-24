import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import StatCards from './components/overview/StatCards';
import BiddersTable from './components/overview/BiddersTable';
import InspectionDrawer from './components/overview/InspectionDrawer';
import SubmitBidModal from './components/overview/SubmitBidModal';
import VerificationLab from './components/verify/VerificationLab';
import TenderDecisionMatrix from './components/matrix/TenderDecisionMatrix';
import StatutoryAudit from './components/audit/StatutoryAudit';
import ProcurementRules from './components/rules/ProcurementRules';
import MockRegistry from './components/registry/MockRegistry';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import EngineSettings from './components/settings/EngineSettings';
import LoginScreen from './components/auth/LoginScreen';
import { INITIAL_TENDER } from './data/mockData';
import { normalizeBidRecord } from './utils/formatters';
import { 
  ArrowRight,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  // Tab/view switching using state variable `currentView` ('overview' | 'verify' | 'tender_matrix' | 'audit' | 'rules' | 'registry' | 'analytics' | 'settings')
  const [currentView, setCurrentView] = useState('overview');
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('bidwise_logged_in') === '1');
  const [userEmail, setUserEmail] = useState(() => sessionStorage.getItem('bidwise_user_email') || 'officer@bidwise.gov.in');
  
  // Theme System (Light / Dark mode persisted in localStorage)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('bidwise_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('bidwise_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // App state
  const [tender, setTender] = useState(INITIAL_TENDER);
  const [bidders, setBidders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBidderForInspect, setSelectedBidderForInspect] = useState(null);
  const [isInspectionDrawerOpen, setIsInspectionDrawerOpen] = useState(false);
  const [isSubmitBidModalOpen, setIsSubmitBidModalOpen] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [jwtToken, setJwtToken] = useState('');

  const handleLogin = ({ email }) => {
    sessionStorage.setItem('bidwise_logged_in', '1');
    sessionStorage.setItem('bidwise_user_email', email);
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bidwise_logged_in');
    sessionStorage.removeItem('bidwise_user_email');
    setIsLoggedIn(false);
    setCurrentView('overview');
  };

  // JWT session for the active GeM tender. The tender ID is carried as the token subject.
  useEffect(() => {
    async function issueTenderToken() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tender_id: tender.id, role: 'procurement_officer' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            setJwtToken(data.token);
            sessionStorage.setItem('bidwise_jwt', data.token);
          }
        }
      } catch (err) {
        // Backend may be offline during UI-only demos; keep the interface usable.
        const cached = sessionStorage.getItem('bidwise_jwt');
        if (cached) setJwtToken(cached);
      }
    }
    issueTenderToken();
  }, [tender.id]);

  // DYNAMIC TABLE FETCH ON MOUNT: GET http://127.0.0.1:8000/api/bids
  useEffect(() => {
    async function fetchBids() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/bids');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setApiConnected(true);
            if (data.length === 0) {
              setBidders([]);
            } else {
              // Normalize fetched bids using unified schema
              const normalizedBids = data.map((item, idx) => normalizeBidRecord(item, idx + 1));
              setBidders(normalizedBids);
            }
          }
        }
      } catch (err) {
        console.info("Backend GET http://127.0.0.1:8000/api/bids is offline, initializing default dataset.", err);
      }
    }

    fetchBids();
  }, []);

  // Derived counts for Overview StatCards
  const totalEvaluated = bidders.length;
  const qualifiedCount = bidders.filter(b => (b.status || '').toUpperCase() === 'QUALIFIED').length;
  const disqualifiedCount = bidders.filter(b => (b.status || '').toUpperCase() === 'DISQUALIFIED').length;
  const pendingCount = bidders.filter(b => (b.status || '').toUpperCase() === 'ACTION REQUIRED').length;

  // Handler: Inspect Dossier Trigger
  const handleInspectBidder = (bidder) => {
    setSelectedBidderForInspect(bidder);
    setIsInspectionDrawerOpen(true);
  };

  // Handler: Update Bidder Decision in Inspection Drawer
  const handleUpdateBidderDecision = (bidderId, newStatus, remarks) => {
    setBidders(prev => prev.map(b => {
      if (b.id === bidderId) {
        const newAudit = {
          timestamp: "Just now",
          action: `Officer changed status to ${newStatus}`,
          actor: "Devendra Verma (Jt. Dir)",
        };
        return {
          ...b,
          status: newStatus,
          officerRemarks: remarks,
          auditHistory: [newAudit, ...(b.auditHistory || [])]
        };
      }
      return b;
    }));

    // Also update selected bidder instance
    setSelectedBidderForInspect(prev => prev && prev.id === bidderId ? {
      ...prev,
      status: newStatus,
      officerRemarks: remarks,
    } : prev);
  };

  // Prepend new bid or update existing bid by id or pan
  const handleNewBidSubmitted = (newBid) => {
    const normalized = normalizeBidRecord(newBid);
    if (!normalized) return;
    setBidders(prev => {
      const idx = prev.findIndex(b => b.id === normalized.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = normalized;
        return updated;
      }
      return [normalized, ...prev.filter(b => (b.id !== normalized.id) && (!normalized.pan || normalized.pan === 'N/A' || b.pan !== normalized.pan))];
    });
  };

  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bw-bg-main)] text-[var(--bw-text-primary)]">
      {/* Left Slim Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        biddersCount={totalEvaluated}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userEmail={userEmail}
        onLogout={handleLogout}
        theme={theme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Main Header */}
        <Topbar
          tender={tender}
          jwtToken={jwtToken}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onUploadClick={() => setIsSubmitBidModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* SCREEN 1: Overview & Active Bids Dashboard */}
            {currentView === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Screen Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Technical Bid Compliance Evaluation
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        • GeM Integrated Verification Layer
                      </span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Active Technical Bids & Compliance Status
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Automated statutory evaluation verifying PAN, GSTIN, Make in India local content %, and central debarment watchlists.
                    </p>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSubmitBidModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Submit Bid</span>
                    </button>

                    <button
                      onClick={() => setCurrentView('tender_matrix')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <span>View L1 Decision Matrix</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                </div>

                {/* Top 4 Summary Cards */}
                <StatCards
                  totalCount={totalEvaluated}
                  qualifiedCount={qualifiedCount}
                  disqualifiedCount={disqualifiedCount}
                  pendingCount={pendingCount}
                  activeFilter={filterStatus}
                  setActiveFilter={setFilterStatus}
                />

                {/* Main Evaluation Table */}
                <BiddersTable
                  bidders={bidders}
                  onInspectBidder={handleInspectBidder}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  searchQuery={searchQuery}
                  onOpenSubmitModal={() => setIsSubmitBidModalOpen(true)}
                />

              </div>
            )}

            {/* SCREEN 2: Live AI Document Verification Lab */}
            {currentView === 'verify' && (
              <div className="animate-in fade-in duration-200">
                <VerificationLab
                  jwtToken={jwtToken}
                  defaultTenderId={tender.id}
                  onDossierVerified={handleNewBidSubmitted}
                />
              </div>
            )}

            {/* SCREEN 3: Tender Evaluation & L1 Decision Matrix */}
            {currentView === 'tender_matrix' && (
              <div className="animate-in fade-in duration-200">
                <TenderDecisionMatrix
                  tender={tender}
                  bidders={bidders}
                  onInspectBidder={handleInspectBidder}
                  jwtToken={jwtToken}
                />
              </div>
            )}

            {/* SCREEN 4: Statutory Audit Workspace */}
            {currentView === 'audit' && (
              <div className="animate-in fade-in duration-200">
                <StatutoryAudit bidders={bidders} />
              </div>
            )}

            {/* SCREEN 5: Procurement Rules / Make in India */}
            {currentView === 'rules' && (
              <div className="animate-in fade-in duration-200">
                <ProcurementRules />
              </div>
            )}

            {/* SCREEN 6: Demo Mock Registry Gateway */}
            {currentView === 'registry' && (
              <div className="animate-in fade-in duration-200">
                <MockRegistry bidders={bidders} />
              </div>
            )}

            {currentView === 'analytics' && (
              <AnalyticsPage bidders={bidders} onBack={() => setCurrentView('overview')} />
            )}

            {currentView === 'settings' && (
              <EngineSettings />
            )}

          </div>
        </main>
      </div>

      {/* Slide-over Right Drawer (Inspection View) */}
      <InspectionDrawer
        isOpen={isInspectionDrawerOpen}
        onClose={() => setIsInspectionDrawerOpen(false)}
        bidder={selectedBidderForInspect}
        onUpdateBidderDecision={handleUpdateBidderDecision}
        jwtToken={jwtToken}
      />

      {/* Submit Bid Modal */}
      <SubmitBidModal
        isOpen={isSubmitBidModalOpen}
        onClose={() => setIsSubmitBidModalOpen(false)}
        onBidSubmitted={handleNewBidSubmitted}
        defaultTenderId={tender.id}
        jwtToken={jwtToken}
      />
    </div>
  );
}

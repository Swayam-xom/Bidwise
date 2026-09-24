import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  LogOut,
  ShieldCheck,
  Trophy,
  FileText,
  Layers,
  Database,
  Settings,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Search,
  BrainCircuit,
  Wifi,
  Server
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  biddersCount = 12,
  searchQuery = '',
  setSearchQuery = () => {},
  userEmail = 'officer@bidwise.gov.in',
  onLogout = () => {},
  theme = 'dark'
}) {
  const mainNavItems = [
    {
      id: 'overview',
      label: 'Overview & Bids',
      sublabel: 'Compliance Dashboard',
      icon: LayoutDashboard,
      badge: biddersCount,
    },
    {
      id: 'verify',
      label: 'AI Verification Lab',
    
      icon: ShieldCheck,
      badge: 'Evaluation',
      isHot: true,
    },
    {
      id: 'tender_matrix',
      label: 'L1 Decision Matrix',
      sublabel: 'Financial Evaluation',
      icon: Trophy,
      badge: 'Decision',
    },
  ];

  const secondaryNavItems = [
    {
      id: 'audit',
      label: 'Statutory Audits',
      icon: FileText,
    },
    {
      id: 'registry',
      label: 'GeM / MCA Registry',
      icon: Database,
    },
    {
      id: 'rules',
      label: 'Procurement Rules (MII)',
      icon: Layers,
    },
    {
      id: 'analytics',
      label: 'Analytics & Graphs',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Engine Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="bidwise-sidebar">
      {/* Background ambient effects */}
      <div className="sidebar-bg-glow sidebar-bg-glow-1" />
      <div className="sidebar-bg-glow sidebar-bg-glow-2" />
      <div className="sidebar-wave" />

      <div className="sidebar-top">
        {/* BRAND */}
        <div className="bidwise-brand">
          <div className="bidwise-logo-box">
            <div className="bidwise-logo">
              <Sparkles />
            </div>
          </div>

          <div className="bidwise-brand-text">
            <div className="bidwise-name">
              Bid<span>wise</span>
            </div>
            <div className="bidwise-subtitle">
              GeM Evaluation Layer
            </div>
          </div>
        </div>

        {/* AI & GOV TAGLINE */}
        <div className="bidwise-ai-tag">
          <BrainCircuit />
          <span>COMPLIANCE & L1 EVALUATION</span>
        </div>

        {/* SEARCH */}
        <div className="bidwise-search">
          <Search />
          <input
            aria-label="Search modules and tenders"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchQuery('');
            }}
            placeholder="Search modules, tenders..."
          />
          <kbd>⌘ K</kbd>
        </div>

        {/* SEARCH DROPDOWN IF SEARCHING */}
        {searchQuery.trim() && (
          <div className="bidwise-search-results">
            {[
              ...mainNavItems.map(item => ({ ...item, group: 'Core evaluation' })),
              ...secondaryNavItems.map(item => ({ ...item, group: 'Integrations & rules' })),
            ]
              .filter(item =>
                `${item.label} ${item.sublabel || ''} ${item.group}`.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(item => (
                <button
                  key={`search-${item.id}`}
                  className="bidwise-search-result"
                  onClick={() => {
                    setCurrentView(item.id);
                    setSearchQuery('');
                  }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                  <ChevronRight />
                </button>
              ))}
            {![
              ...mainNavItems.map(item => ({ ...item, group: 'Core evaluation' })),
              ...secondaryNavItems.map(item => ({ ...item, group: 'Integrations & rules' })),
            ].some(item =>
              `${item.label} ${item.sublabel || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
            ) && <div className="bidwise-no-results">No matching module</div>}
          </div>
        )}

        {/* CORE EVALUATION SECTION */}
        <div className="bidwise-section">
          <div className="bidwise-section-title">
            CORE EVALUATION
          </div>

          <div className="bidwise-main-nav">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`bidwise-nav-item ${isActive ? 'bidwise-nav-active' : ''}`}
                >
                  {isActive && <span className="active-left-glow" />}

                  <div className="bidwise-nav-icon">
                    <Icon />
                  </div>

                  <div className="bidwise-nav-content">
                    <div className="bidwise-nav-title">
                      {item.label}
                    </div>
                    <div className="bidwise-nav-subtitle">
                      {item.sublabel}
                    </div>
                  </div>

                  {item.badge && (
                    <div className={`bidwise-badge ${item.isHot ? 'bidwise-live-badge' : ''}`}>
                      {item.isHot && <span className="live-indicator" />}
                      {item.badge}
                    </div>
                  )}

                  <ChevronRight className="bidwise-nav-arrow" />
                </button>
              );
            })}
          </div>
        </div>

        {/* INTEGRATIONS & POLICY RULES */}
        <div className="bidwise-section bidwise-integrations">
          <div className="bidwise-section-title">
            INTEGRATIONS & RULES
          </div>

          <div className="bidwise-secondary-nav">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setSearchQuery('');
                  }}
                  className={`bidwise-secondary-item ${isActive ? 'bidwise-nav-active' : ''}`}
                >
                  <div className="bidwise-secondary-icon">
                    <Icon />
                  </div>

                  <span className="flex-1 text-left text-xs font-semibold">
                    {item.label}
                  </span>

                  <ChevronRight className="bidwise-secondary-arrow" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="bidwise-bottom">
        {/* USER CARD */}
        <div className="bidwise-user-card">
          <div className="bidwise-avatar-wrapper">
            <div className="bidwise-avatar">
              DV
            </div>
            <span className="avatar-online" />
          </div>

          <div className="bidwise-user-info">
            <div className="bidwise-user-name">
              Devendra Verma
            </div>
            <div className="bidwise-user-role">
              <CheckCircle2 />
              <span>Procurement Officer</span>
            </div>
            <div className="bidwise-user-email" title={userEmail}>
              {userEmail}
            </div>
          </div>

          <div className="bidwise-user-org">
            MeitY
          </div>

          <button 
            className="bidwise-logout-button" 
            onClick={onLogout} 
            title="Log out" 
            aria-label="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>

        {/* HONEST STATUS CONNECTOR LABEL */}
        <div className="bidwise-api">
          <div className="bidwise-api-left">
            <div className="bidwise-api-icon">
              <Server />
            </div>
           
          </div>
          <span className="font-mono text-[9px] text-slate-400"></span>
        </div>
      </div>
    </aside>
  );
}
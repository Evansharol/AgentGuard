import React from 'react';
import { 
  ShieldCheck, 
  Play, 
  CheckSquare, 
  AlertTriangle, 
  Sliders, 
  Bot, 
  History, 
  Cpu,
  RefreshCw,
  Info
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  complianceScore: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  complianceScore,
  onRefresh,
  isLoading
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: ShieldCheck },
    { id: 'simulator', label: 'Test Lab', icon: Play, badge: 'Live' },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, count: pendingApprovalsCount },
    { id: 'findings', label: 'Incidents', icon: AlertTriangle },
    { id: 'profiles', label: 'Policies', icon: Sliders },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'architecture', label: 'How It Works', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-500 to-fuchsia-400 p-0.5 shadow-lg shadow-violet-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-violet-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-violet-400 bg-clip-text text-transparent">
                  AgentGuard
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-violet-400 bg-violet-950/80 border border-violet-800/60 px-2 py-0.5 rounded-full uppercase">
                  v1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">AI agent safety & policy enforcement</p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 relative ${
                    isActive
                      ? 'bg-violet-600/15 text-violet-400 border border-violet-500/30 shadow-sm shadow-violet-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status Indicators & Quick Controls */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-400 font-medium">Safety score:</span>
              <span className={`font-bold ${
                complianceScore >= 80 ? 'text-emerald-400' : complianceScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {complianceScore.toFixed(1)}%
              </span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Governance Data"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden overflow-x-auto flex space-x-2 px-4 py-2 bg-slate-950 border-t border-slate-800">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium ${
              activeTab === item.id ? 'bg-violet-600 text-white' : 'text-slate-400 bg-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};

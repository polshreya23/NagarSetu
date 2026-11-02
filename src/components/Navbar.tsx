import React from 'react';
import {
  ShieldAlert,
  MapPin,
  BarChart3,
  PlusCircle,
  User as UserIcon,
  ChevronDown,
  Building2,
  FileText,
  Home,
  RotateCcw,
} from 'lucide-react';
import { User } from '../types/index.ts';

interface NavbarProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  availableUsers: User[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReportModal: () => void;
  onResetDemoData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  availableUsers,
  activeTab,
  setActiveTab,
  onOpenReportModal,
  onResetDemoData,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
      {/* Top Demo Notification Ribbon */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs font-semibold py-1 px-4 text-center flex items-center justify-center space-x-2">
        <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase font-bold">
          Demo Prototype
        </span>
        <span>
          NagarSetu AI Civic Intelligence Platform for Pune Urban Area. Simulated PMC testbed — Not an official government portal.
        </span>
        <button
          onClick={onResetDemoData}
          title="Reload baseline demo reports"
          className="ml-3 underline hover:text-amber-200 cursor-pointer flex items-center gap-1 text-[11px]"
        >
          <RotateCcw className="w-3 h-3" /> Reset Demo Data
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Nagar<span className="text-blue-400">Setu</span>
                </span>
                <span className="text-[10px] bg-blue-900/80 text-blue-300 border border-blue-700/50 px-1.5 py-0.5 rounded font-mono">
                  PUNE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide font-medium">
                Report • Detect • Prioritize • Resolve
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'landing'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('citizen')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'citizen'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Citizen Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Authority Dashboard</span>
              {currentUser.role === 'admin' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Live Pune Map</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Right Action & User Role Switcher */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenReportModal}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </button>

            {/* User Profile / Quick Switcher */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs transition"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'A' : 'C'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {currentUser.role === 'admin' ? 'Authority (Admin)' : 'Citizen'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-700">
                    <p className="text-[11px] text-slate-400 font-medium">Switch Active Profile for Demo:</p>
                  </div>
                  <div className="p-1 space-y-1">
                    {availableUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${
                          currentUser.id === u.id
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium'
                            : 'hover:bg-slate-700/60 text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.ward || u.email}</div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                              : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                          }`}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="px-3 pt-2 pb-1 border-t border-slate-700 text-[10px] text-slate-400">
                    Role determines authority permissions and views.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-slate-800 px-3 py-2 flex items-center justify-around text-xs bg-slate-900/95 overflow-x-auto">
        <button
          onClick={() => setActiveTab('landing')}
          className={`px-2.5 py-1.5 rounded ${activeTab === 'landing' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('citizen')}
          className={`px-2.5 py-1.5 rounded ${activeTab === 'citizen' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
        >
          Citizen
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-2.5 py-1.5 rounded ${activeTab === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
        >
          Authority
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-2.5 py-1.5 rounded ${activeTab === 'map' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
        >
          Map
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-2.5 py-1.5 rounded ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
        >
          Analytics
        </button>
      </div>
    </header>
  );
};

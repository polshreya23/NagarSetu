import React, { useState } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  MapPin,
  Search,
  Filter,
  Eye,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Complaint, User, ComplaintStatus, CivicCategory } from '../types/index.ts';
import { SUPPORTED_CATEGORIES } from '../../server/ai.ts';

interface CitizenDashboardProps {
  currentUser: User;
  complaints: Complaint[];
  onOpenReportModal: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  currentUser,
  complaints,
  onOpenReportModal,
  onSelectComplaint,
}) => {
  const [activeView, setActiveView] = useState<'my' | 'all'>('my');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Citizen's personal complaints
  const myComplaints = complaints.filter(
    (c) => c.submittedBy.userId === currentUser.id || c.linkedUserIds.includes(currentUser.id)
  );

  const displayedList = activeView === 'my' ? myComplaints : complaints;

  const filteredComplaints = displayedList.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchId = c.id.toLowerCase().includes(q);
      const matchLoc = c.location.address.toLowerCase().includes(q) || c.location.ward.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchLoc) return false;
    }
    return true;
  });

  const myPending = myComplaints.filter((c) => c.status === 'Pending').length;
  const myInProgress = myComplaints.filter((c) => c.status === 'In Progress').length;
  const myResolved = myComplaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Welcome, {currentUser.name}
            </h1>
            <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
              Citizen Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered Ward: <span className="font-semibold text-slate-700">{currentUser.ward || 'Shivajinagar'}</span> • Report civic grievances, monitor AI diagnostics, and track repair SLAs.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-600/25 transition transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Civic Issue</span>
        </button>
      </div>

      {/* Citizen Personal Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">My Registered Reports</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{myComplaints.length}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Submitted / Co-Reported</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Pending Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">{myPending}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Under verification</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Work In Progress</div>
          <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">{myInProgress}</div>
          <div className="text-[11px] text-blue-700 font-medium mt-0.5">Dispatched to field</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Resolved Complaints</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{myResolved}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Completed & verified</div>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* My Complaints vs All Complaints Tab */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveView('my')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'my'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Complaints ({myComplaints.length})
            </button>
            <button
              onClick={() => setActiveView('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'all'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Pune Reports ({complaints.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ID, keyword, road..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 text-slate-700 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 text-slate-700 font-medium"
          >
            <option value="All">All Categories</option>
            {SUPPORTED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {(statusFilter !== 'All' || categoryFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('All');
                setCategoryFilter('All');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Grid */}
      {filteredComplaints.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Complaints Match Your Criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeView === 'my'
              ? "You haven't reported any grievances matching this filter yet."
              : 'Try broadening your search query or reset filters.'}
          </p>
          {activeView === 'my' && (
            <button
              onClick={onOpenReportModal}
              className="mt-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              Report an Issue
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredComplaints.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectComplaint(c)}
              className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Photo & Category Badge */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                    {c.category}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.priorityLevel === 'Critical'
                          ? 'bg-red-500 text-white'
                          : c.priorityLevel === 'High'
                          ? 'bg-orange-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {c.priorityLevel} ({c.priorityScore})
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono font-bold text-blue-700">{c.id}</span>
                    <span className="flex items-center gap-1 text-[10px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {c.description}
                  </p>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.location.address}</span>
                  </div>

                  {/* AI Confidence & Urgency */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-[10px] text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                      <Sparkles className="w-3 h-3 text-amber-500" /> AI Verified: {Math.round((c.aiAnalysis?.confidence || 0.9) * 100)}%
                    </span>
                    <span className="text-slate-500">Reports: <strong>{c.reportCount}</strong></span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Status */}
              <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                <span
                  className={`font-bold px-2.5 py-0.5 rounded text-[11px] ${
                    c.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : c.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {c.status}
                </span>

                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Track Status</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

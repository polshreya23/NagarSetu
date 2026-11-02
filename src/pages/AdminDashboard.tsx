import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sliders,
  Eye,
  Building2,
  MapPin,
  Sparkles,
  ArrowUpDown,
  Download,
  Flame,
} from 'lucide-react';
import { Complaint, User, ComplaintStatus, SeverityLevel, PriorityLevel } from '../types/index.ts';
import { SUPPORTED_CATEGORIES } from '../../server/ai.ts';
import { PUNE_WARDS } from '../utils/puneData.ts';

interface AdminDashboardProps {
  currentUser: User;
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onOverridePriority: (complaint: Complaint) => void;
  onQuickStatusChange: (complaintId: string, newStatus: ComplaintStatus) => void;
  onSwitchToAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  complaints,
  onSelectComplaint,
  onOverridePriority,
  onQuickStatusChange,
  onSwitchToAdmin,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'reports'>('priority');

  // KPIs
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'Pending').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const critical = complaints.filter((c) => c.priorityLevel === 'Critical' && c.status !== 'Resolved').length;

  // Filtered & Sorted List
  const filteredList = complaints
    .filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (severityFilter !== 'All' && c.severity !== severityFilter) return false;
      if (priorityFilter !== 'All' && c.priorityLevel !== priorityFilter) return false;
      if (wardFilter !== 'All' && !c.location.ward.includes(wardFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = c.title.toLowerCase().includes(q);
        const mId = c.id.toLowerCase().includes(q);
        const mAddr = c.location.address.toLowerCase().includes(q);
        const mCit = c.submittedBy.name.toLowerCase().includes(q);
        if (!mTitle && !mId && !mAddr && !mCit) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priorityScore - a.priorityScore;
      }
      if (sortBy === 'reports') {
        return (b.reportCount || 1) - (a.reportCount || 1);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Restricted Municipal Authority Portal
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          You are currently logged in as citizen <span className="font-semibold text-slate-800">{currentUser.name}</span>. Access to SLA enforcement, status dispatches, and priority override requires municipal administrative credentials.
        </p>
        <button
          onClick={onSwitchToAdmin}
          className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition cursor-pointer"
        >
          Switch to Authority Profile (Shreya Pol - Super Administrator)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Pune Municipal Command & Civic Operations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Super Administrator on Duty: <span className="text-purple-300 font-bold">Shreya Pol</span> (Super Administrator) • Central Grid Dispatch & Algorithmic Priority Queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-purple-900/60 border border-purple-500/50 rounded-xl px-3.5 py-2 text-right hidden sm:block">
            <div className="text-xs font-bold text-purple-200">Shreya Pol</div>
            <div className="text-[10px] text-purple-300 font-mono">Super Administrator</div>
          </div>

          {critical > 0 && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-2 flex items-center gap-2.5 text-red-300">
              <Flame className="w-5 h-5 text-red-400 animate-pulse" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">Critical SLA Alert</div>
                <div className="text-[11px] text-red-200">
                  {critical} critical unresolved grievance(s).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Registered</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across 12 Pune Wards</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Pending Triage</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">{pending}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Awaiting dispatch</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">In Progress</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1 font-mono">{inProgress}</div>
          <div className="text-[11px] text-blue-700 mt-0.5">Field crew active</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Resolved</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">{resolved}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Audit verified</div>
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm bg-red-50/30">
          <div className="text-xs font-bold text-red-700">Critical Priority</div>
          <div className="text-2xl font-extrabold text-red-600 mt-1 font-mono">{critical}</div>
          <div className="text-[11px] text-red-800 font-medium mt-0.5">Score &ge; 75 / 100</div>
        </div>
      </div>

      {/* Control Bar & Multi-Field Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Complaint Token (PMC-...), title, landmark, citizen name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              <option value="priority">Priority Score (Highest First)</option>
              <option value="date">Submission Time (Newest First)</option>
              <option value="reports">Report Count (Most Endorsed)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold text-[11px]">Filters:</span>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 text-slate-700"
          >
            <option value="All">All Categories</option>
            {SUPPORTED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 text-slate-700"
          >
            <option value="All">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 text-slate-700"
          >
            <option value="All">All Priority Tiers</option>
            <option value="Critical">Critical (75+)</option>
            <option value="High">High (50-74)</option>
            <option value="Medium">Medium (30-49)</option>
            <option value="Low">Low (&lt;30)</option>
          </select>

          {/* Ward */}
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 text-slate-700"
          >
            <option value="All">All Wards</option>
            {PUNE_WARDS.map((w) => (
              <option key={w} value={w.split('-')[0].trim()}>
                {w}
              </option>
            ))}
          </select>

          {(statusFilter !== 'All' ||
            categoryFilter !== 'All' ||
            severityFilter !== 'All' ||
            priorityFilter !== 'All' ||
            wardFilter !== 'All' ||
            searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('All');
                setCategoryFilter('All');
                setSeverityFilter('All');
                setPriorityFilter('All');
                setWardFilter('All');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold ml-auto"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Complaints Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ticket / Incident</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Ward & Location</th>
                <th className="py-3 px-3 text-center">Severity</th>
                <th className="py-3 px-3 text-center">Priority Score</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredList.map((c) => {
                const isCriticalAlert = c.priorityLevel === 'Critical' && c.status !== 'Resolved';
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isCriticalAlert ? 'bg-red-50/40' : ''
                    }`}
                  >
                    {/* Ticket & Photo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={c.imageUrl}
                          alt={c.title}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-blue-700">{c.id}</span>
                            {c.isDemo && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold uppercase">
                                DEMO
                              </span>
                            )}
                          </div>
                          <div
                            onClick={() => onSelectComplaint(c)}
                            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1 max-w-[220px]"
                            title={c.title}
                          >
                            {c.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            By {c.submittedBy.name} • {c.reportCount} report(s)
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="text-xs font-semibold text-slate-700 block">{c.category}</span>
                      <span className="text-[10px] text-slate-400 truncate block max-w-[130px]">
                        {c.assignedDepartment || 'Municipal Operations'}
                      </span>
                    </td>

                    {/* Ward & Address */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{c.location.ward.split('-')[0]}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={c.location.address}>
                        {c.location.address}
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.severity === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : c.severity === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : c.severity === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.severity}
                      </span>
                    </td>

                    {/* Priority Score */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`font-mono font-extrabold text-sm ${
                            c.priorityScore >= 75
                              ? 'text-red-700 font-black'
                              : c.priorityScore >= 50
                              ? 'text-orange-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {c.priorityScore}
                          <span className="text-[10px] text-slate-400 font-normal">/100</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">
                          {c.priorityLevel}
                        </span>
                        {c.priorityOverride?.isOverridden && (
                          <span className="text-[9px] bg-purple-100 text-purple-800 px-1 rounded font-bold mt-0.5">
                            Overridden
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status with Quick Toggle */}
                    <td className="py-3 px-3 text-center">
                      <select
                        value={c.status}
                        onChange={(e) => onQuickStatusChange(c.id, e.target.value as ComplaintStatus)}
                        className={`text-xs font-bold rounded-lg px-2 py-1 border cursor-pointer ${
                          c.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : c.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectComplaint(c)}
                          title="Inspect full details, audit trail, and dispatch"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOverridePriority(c)}
                          title="Override Priority Score"
                          className="bg-slate-100 hover:bg-slate-200 text-purple-700 p-1.5 rounded-lg transition"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

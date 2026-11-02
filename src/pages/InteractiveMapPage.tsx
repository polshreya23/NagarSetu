import React, { useState } from 'react';
import {
  MapPin,
  Filter,
  Eye,
  Layers,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Complaint } from '../types/index.ts';
import { InteractiveMap } from '../components/InteractiveMap.tsx';
import { SUPPORTED_CATEGORIES } from '../../server/ai.ts';

interface InteractiveMapPageProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenReportModal: () => void;
}

export const InteractiveMapPage: React.FC<InteractiveMapPageProps> = ({
  complaints,
  onSelectComplaint,
  onOpenReportModal,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedPinComplaint, setSelectedPinComplaint] = useState<Complaint | null>(null);

  const filteredComplaints = complaints.filter((c) => {
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Top Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Pune Urban GIS Incident Grid</h1>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
              OpenStreetMap
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualizing {filteredComplaints.length} geo-tagged complaints across Shivajinagar, Kothrud, Viman Nagar, Hadapsar, Baner, and Camp.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="All">All Categories</option>
            {SUPPORTED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenReportModal}
            className="bg-blue-600 text-white px-3.5 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            + Report at Pin
          </button>
        </div>
      </div>

      {/* Main Grid: Map + Side List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Map View */}
        <div className="lg:col-span-2 space-y-2">
          <InteractiveMap
            mode="view"
            height="580px"
            center={[18.5284, 73.8567]}
            zoom={12}
            complaints={filteredComplaints}
            onSelectComplaint={(c) => {
              setSelectedPinComplaint(c);
              onSelectComplaint(c);
            }}
          />
          <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
            <span>Click any marker to inspect photos and municipal priority score.</span>
            <span>Numbers on pins represent Priority Scores (0-100).</span>
          </div>
        </div>

        {/* Complaints List in Selected Area */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 max-h-[610px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Issues List ({filteredComplaints.length})
            </h3>
            <span className="text-[10px] text-slate-400">Sorted by Priority</span>
          </div>

          <div className="space-y-2.5">
            {filteredComplaints
              .sort((a, b) => b.priorityScore - a.priorityScore)
              .map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectComplaint(c)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-white transition cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-blue-700">{c.id}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        c.priorityLevel === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : c.priorityLevel === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.priorityScore}/100 ({c.priorityLevel})
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{c.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate">📍 {c.location.address}</p>

                  <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                    <span>{c.category}</span>
                    <span
                      className={`font-semibold ${
                        c.status === 'Resolved'
                          ? 'text-emerald-600'
                          : c.status === 'In Progress'
                          ? 'text-blue-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

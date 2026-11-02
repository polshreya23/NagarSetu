import React from 'react';
import {
  ShieldAlert,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building2,
  Camera,
  Layers,
  Wrench,
  Users,
} from 'lucide-react';
import { Complaint } from '../types/index.ts';

interface LandingPageProps {
  complaints: Complaint[];
  onOpenReportModal: () => void;
  onNavigateToTab: (tab: string) => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  complaints,
  onOpenReportModal,
  onNavigateToTab,
  onSelectComplaint,
}) => {
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'Pending').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const critical = complaints.filter((c) => c.priorityLevel === 'Critical').length;

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>AI-Driven Municipal Governance Engine • Pune Urban Area</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Nagar<span className="text-blue-400">Setu</span>
            <span className="block text-xl sm:text-2xl lg:text-3xl font-medium text-slate-300 mt-2">
              Report. Detect. Prioritize. Resolve.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Bridging citizens and civic authorities through intelligent visual AI. Instant pothole detection, garbage monitoring, water leakage tracking, automated duplicate deduplication, and algorithmic priority scoring.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenReportModal}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transform hover:-translate-y-0.5 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Report a Civic Issue Now</span>
            </button>

            <button
              onClick={() => onNavigateToTab('map')}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition"
            >
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Explore Live Pune Map</span>
            </button>

            <button
              onClick={() => onNavigateToTab('admin')}
              className="bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-700/50 px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition"
            >
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Authority Command</span>
            </button>
          </div>

          {/* Live KPI Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 max-w-4xl mx-auto">
            <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-4 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{total}</div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Total Complaints
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-4 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">{pending}</div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Pending Verification
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-4 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">{inProgress}</div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Work In Progress
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-4 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">{resolved}</div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Civic Issues Resolved
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* How It Works Section */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Intelligent Workflow
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              How NagarSetu Accelerates Urban Resolution
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              A 4-stage smart city pipeline combining computer vision, geospatial deduplication, and mathematical prioritization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900">1. Citizen Reports</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Snap or upload an on-site photo with GPS geo-tagging or manual Pune landmark pinpointing.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900">2. Gemini AI Diagnoses</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multimodal vision classifies defect category, scores confidence, and estimates physical severity (Low to Critical).
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900">3. Deduplication & Scoring</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identifies 100m proximity duplicates within 7 days. Computes priority: 0.5×Severity + 0.3×Reports + 0.2×Waiting.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                4
              </div>
              <h4 className="text-sm font-bold text-slate-900">4. Authority Resolves</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ward officers take action based on dynamic priority scores, post photo proofs, and notify co-reporting citizens.
              </p>
            </div>
          </div>
        </section>

        {/* Priority Formula Explainer */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Mathematical Prioritization Model
              </span>
              <h3 className="text-xl sm:text-2xl font-bold">
                Objective Priority Scoring: Ensuring Critical Repairs Never Get Lost
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Unlike traditional complaint boxes that operate on first-come-first-serve, NagarSetu prioritizes civic issues using an algorithmic formula designed for municipal field efficiency:
              </p>
              <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl font-mono text-xs text-blue-300">
                Priority = 0.5 × Severity + 0.3 × ReportCountScore + 0.2 × WaitingTimeScore
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-xs space-y-2">
              <div className="text-slate-400 font-semibold">Tiers & Weights:</div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Severity (50%)</span>
                <span className="text-slate-300">Low=20, Med=45, High=75, Crit=100</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Citizen Reports (30%)</span>
                <span className="text-slate-300">min(100, 25 × (reports - 1))</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Waiting Age (20%)</span>
                <span className="text-slate-300">min(100, 100 × hours / 72)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Pune Highlights */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Pune Civic Complaints</h3>
              <p className="text-xs text-slate-500">
                Live simulated tickets from Shivajinagar, Kothrud, Viman Nagar, Baner, and Hadapsar.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('citizen')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All Complaints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {complaints.slice(0, 3).map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col"
              >
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                    {c.category}
                  </div>
                  <div className="absolute top-2 right-2">
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

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-mono font-semibold text-blue-700">{c.id}</span>
                      <span>📍 {c.location.ward.split('-')[0]}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2">
                      {c.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {c.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      Reports: <strong>{c.reportCount}</strong>
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        c.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

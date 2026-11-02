import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldAlert,
} from 'lucide-react';

interface AnalyticsData {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    critical: number;
    high: number;
    avgResolutionHours: number;
    avgConfidence: number;
    resolutionRate: number;
  };
  categoryBreakdown: Array<{
    name: string;
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  }>;
  wardBreakdown: Array<{
    ward: string;
    count: number;
    critical: number;
    resolved: number;
  }>;
  severityDistribution: Array<{
    name: string;
    count: number;
    fill: string;
  }>;
}

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed fetching analytics:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Loading Pune municipal analytics...
      </div>
    );
  }

  const { stats, categoryBreakdown, wardBreakdown, severityDistribution } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Civic Intelligence & Turnaround Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pune Urban Infrastructure Grievance Resolution Metrics • Gemini 3.8 Flash Vision Diagnostics
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs font-semibold text-blue-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Average AI Assessment Confidence: {stats.avgConfidence}%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Overall Resolution Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {stats.resolutionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats.resolved} of {stats.total} closed</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Average Turnaround Time</div>
          <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
            {stats.avgResolutionHours} hrs
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Registration to field fix</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Critical Priority Load</div>
          <div className="text-2xl font-bold text-red-600 mt-1 font-mono">
            {stats.critical}
          </div>
          <div className="text-[11px] text-red-700 mt-0.5">High hazard items</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Active Field Deployments</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
            {stats.inProgress}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Teams currently deployed</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Complaints by Category & Status</h3>
            <p className="text-xs text-slate-500">Distribution across major civic defect classes</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBreakdown}
                margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Severity Distribution</h3>
            <p className="text-xs text-slate-500">Classified by multimodal Gemini inspection</p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ward Performance Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Ward-Wise Civic Activity & Resolution</h3>
          <p className="text-xs text-slate-500">Incident concentration across administrative zones in Pune</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Ward Zone</th>
                <th className="py-2.5 px-3">Total Grievances</th>
                <th className="py-2.5 px-3">Critical Hazards</th>
                <th className="py-2.5 px-3">Resolved</th>
                <th className="py-2.5 px-4">Resolution Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {wardBreakdown.map((w, idx) => {
                const pct = w.count > 0 ? Math.round((w.resolved / w.count) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{w.ward}</td>
                    <td className="py-2.5 px-3 font-semibold">{w.count}</td>
                    <td className="py-2.5 px-3">
                      {w.critical > 0 ? (
                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px]">
                          {w.critical} Critical
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">{w.resolved}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-600">{pct}%</span>
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

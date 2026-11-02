import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  UserCheck,
  Shield,
  Layers,
  FileCheck,
  Wrench,
  Sliders,
  Send,
  Building,
} from 'lucide-react';
import { Complaint, User, ComplaintStatus, PriorityLevel } from '../types/index.ts';
import { PriorityOverrideModal } from './PriorityOverrideModal.tsx';
import { InteractiveMap } from './InteractiveMap.tsx';

interface ComplaintDetailsModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onComplaintUpdated: (updatedComplaint: Complaint) => void;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaint,
  isOpen,
  onClose,
  currentUser,
  onComplaintUpdated,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<ComplaintStatus>('In Progress');
  const [officerName, setOfficerName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImage, setResolutionImage] = useState('');
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  if (!isOpen || !complaint) return null;

  const isAdmin = currentUser.role === 'admin';
  const hasUserCoReported =
    complaint.submittedBy.userId === currentUser.id ||
    complaint.linkedUserIds.includes(currentUser.id);

  // Status updates
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          status: selectedNewStatus,
          updatedBy: {
            userId: currentUser.id,
            name: currentUser.name,
            role: 'Admin',
          },
          remarks: adminRemarks || `Status marked as ${selectedNewStatus}`,
          assignedDepartment: deptName || complaint.assignedDepartment,
          assignedOfficer: officerName || complaint.assignedOfficer,
          resolutionNotes: selectedNewStatus === 'Resolved' ? resolutionNotes : undefined,
          resolutionImageUrl: selectedNewStatus === 'Resolved' ? resolutionImage : undefined,
        }),
      });

      const data = await res.json();
      if (data.complaint) {
        onComplaintUpdated(data.complaint);
        setAdminRemarks('');
        setResolutionNotes('');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Co-report / upvote
  const handleCoReport = async () => {
    setIsUpvoting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/link-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          citizenNotes: 'Affirmed active civic defect at this location.',
        }),
      });

      const data = await res.json();
      if (data.complaint) {
        onComplaintUpdated(data.complaint);
      }
    } catch (err) {
      console.error('Error co-reporting:', err);
    } finally {
      setIsUpvoting(false);
    }
  };

  // Compute breakdown preview for priority
  const severityPoints =
    complaint.severity === 'Critical'
      ? 100
      : complaint.severity === 'High'
      ? 75
      : complaint.severity === 'Medium'
      ? 45
      : 20;

  const countPoints = Math.min(100, 25 * ((complaint.reportCount || 1) - 1));
  const waitingHours = Math.round(
    Math.max(0, Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60)
  );
  const waitingPoints = Math.min(100, Math.round((100 * waitingHours) / 72));

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
        <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded">
                {complaint.id}
              </span>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-snug">{complaint.title}</h3>
                <p className="text-xs text-slate-400">
                  Registered {new Date(complaint.createdAt).toLocaleString()} • {complaint.location.ward}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {/* Status Pipeline Progress Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Civic Resolution Pipeline</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    complaint.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : complaint.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Current Status: {complaint.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div
                  className={`p-2 rounded-lg border font-semibold ${
                    complaint.status === 'Pending' || complaint.status === 'In Progress' || complaint.status === 'Resolved'
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] text-slate-500">Stage 1</div>
                  1. Pending Verification
                </div>
                <div
                  className={`p-2 rounded-lg border font-semibold ${
                    complaint.status === 'In Progress' || complaint.status === 'Resolved'
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] text-slate-500">Stage 2</div>
                  2. Field Work In Progress
                </div>
                <div
                  className={`p-2 rounded-lg border font-semibold ${
                    complaint.status === 'Resolved'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] text-slate-500">Stage 3</div>
                  3. Resolved & Closed
                </div>
              </div>
            </div>

            {/* Top Grid: Image & Location + AI Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Photo & Map */}
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-slate-100">
                  <img
                    src={complaint.imageUrl}
                    alt={complaint.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-[11px] font-medium">
                    {complaint.category}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{complaint.location.address}</span>
                  </div>
                  <p className="text-slate-500">
                    Ward: {complaint.location.ward} • Pincode: {complaint.location.pincode || '411004'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Coordinates: {complaint.location.lat.toFixed(5)}, {complaint.location.lng.toFixed(5)}
                  </p>
                </div>

                {/* Resolution Image if Resolved */}
                {complaint.status === 'Resolved' && complaint.resolutionImageUrl && (
                  <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3 space-y-2">
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Post-Resolution Photo Proof</span>
                    </div>
                    <img
                      src={complaint.resolutionImageUrl}
                      alt="Resolution Proof"
                      className="w-full h-36 object-cover rounded-lg border border-emerald-300"
                    />
                    {complaint.resolutionNotes && (
                      <p className="text-xs text-emerald-800">
                        <strong>Official Remarks:</strong> {complaint.resolutionNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Priority Scoring Engine Card & AI Assessment */}
              <div className="space-y-4">
                {/* AI Card */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        AI Inspection Assessment
                      </span>
                    </div>
                    <span className="text-[11px] bg-blue-900/60 border border-blue-600/50 text-blue-200 px-2 py-0.5 rounded font-mono">
                      {Math.round((complaint.aiAnalysis?.confidence || 0.9) * 100)}% Confidence
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 italic">
                    "{complaint.aiAnalysis?.description || complaint.description}"
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px]">Severity Estimate:</span>
                      <div className="font-bold text-white">{complaint.severity}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Assigned Department:</span>
                      <div className="font-bold text-blue-300 truncate">
                        {complaint.assignedDepartment || complaint.aiAnalysis?.suggestedDepartment}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRIORITY SCORING BREAKDOWN */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Priority Scoring Engine
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Formula: 0.5×Severity + 0.3×ReportCount + 0.2×WaitingTime
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-extrabold text-blue-700 font-mono">
                        {complaint.priorityScore}
                        <span className="text-xs text-slate-500 font-normal"> / 100</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          complaint.priorityLevel === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : complaint.priorityLevel === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {complaint.priorityLevel} Tier
                      </span>
                    </div>
                  </div>

                  {complaint.priorityOverride?.isOverridden && (
                    <div className="bg-amber-50 border border-amber-300 p-2 rounded text-[11px] text-amber-800 flex items-center justify-between">
                      <span>
                        ⚠️ <strong>Admin Overridden</strong> by {complaint.priorityOverride.overriddenBy}: "{complaint.priorityOverride.reason}"
                      </span>
                    </div>
                  )}

                  {/* Weight Breakdown */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>1. Severity Component (50%)</span>
                        <span className="font-mono font-semibold">{severityPoints} pts → {0.5 * severityPoints} score</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${severityPoints}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>2. Report Count Component (30%)</span>
                        <span className="font-mono font-semibold">
                          {complaint.reportCount} reports ({countPoints} pts) → {Math.round(0.3 * countPoints)} score
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${countPoints}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>3. Waiting Time Component (20%)</span>
                        <span className="font-mono font-semibold">
                          {waitingHours}h waiting ({waitingPoints} pts) → {Math.round(0.2 * waitingPoints)} score
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full"
                          style={{ width: `${waitingPoints}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin Override Trigger */}
                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setOverrideModalOpen(true)}
                        className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Override Priority Score</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Citizen Upvote / Co-report Button */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Community Endorsements: {complaint.reportCount} Citizen(s)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      More reports automatically increase urgency score in municipal SLA.
                    </p>
                  </div>

                  {hasUserCoReported ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <UserCheck className="w-4 h-4" />
                      <span>Co-Reported</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleCoReport}
                      disabled={isUpvoting || complaint.status === 'Resolved'}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>I'm Facing This Too (+1)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status History / Audit Trail */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Official Lifecycle & Audit Trail</span>
              </h4>

              <div className="space-y-3 pl-2 border-l-2 border-slate-200 text-xs">
                {complaint.history.map((entry) => (
                  <div key={entry.id} className="relative pl-4">
                    <span className="absolute -left-[9px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900">
                        {entry.updatedBy}{' '}
                        <span className="text-[10px] font-normal text-slate-500">({entry.role})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{entry.remarks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Status Changer Controls */}
            {isAdmin && (
              <form onSubmit={handleStatusUpdate} className="bg-slate-900 text-white rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Authority Command Actions
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Authenticated Officer: {currentUser.name}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Update Ticket Status
                    </label>
                    <select
                      value={selectedNewStatus}
                      onChange={(e) => setSelectedNewStatus(e.target.value as ComplaintStatus)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Assigned Field Officer
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Er. Nilesh Kadam"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Road Infrastructure Dept"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Internal Progress / Action Remarks
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jetting truck and excavation team deployed on site"
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                {selectedNewStatus === 'Resolved' && (
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-emerald-400">Resolution Closure Data</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Resolution summary notes (e.g. Asphalt patch applied, compacted, inspected)"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Resolution Image URL proof"
                        value={resolutionImage}
                        onChange={(e) => setResolutionImage(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isUpdatingStatus ? 'Recording Update...' : 'Commit Status Change'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Priority Override Modal */}
      {overrideModalOpen && (
        <PriorityOverrideModal
          complaint={complaint}
          isOpen={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          adminName={currentUser.name}
          onOverrideSaved={(updated) => onComplaintUpdated(updated)}
        />
      )}
    </>
  );
};

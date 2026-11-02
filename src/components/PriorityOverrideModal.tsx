import React, { useState } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { Complaint, PriorityLevel } from '../types/index.ts';

interface PriorityOverrideModalProps {
  complaint: Complaint;
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
  onOverrideSaved: (updatedComplaint: Complaint) => void;
}

export const PriorityOverrideModal: React.FC<PriorityOverrideModalProps> = ({
  complaint,
  isOpen,
  onClose,
  adminName,
  onOverrideSaved,
}) => {
  const [level, setLevel] = useState<PriorityLevel>(complaint.priorityLevel);
  const [score, setScore] = useState<number>(complaint.priorityScore);
  const [reason, setReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLevelChange = (newLevel: PriorityLevel) => {
    setLevel(newLevel);
    if (newLevel === 'Critical') setScore(Math.max(85, score));
    else if (newLevel === 'High') setScore(65);
    else if (newLevel === 'Medium') setScore(40);
    else if (newLevel === 'Low') setScore(20);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a mandatory administrative justification for the priority override.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/priority`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-admin-1',
        },
        body: JSON.stringify({
          priorityLevel: level,
          priorityScore: score,
          adminName: 'Shreya Pol',
          reason,
        }),
      });

      const data = await res.json();
      if (data.complaint) {
        onOverrideSaved(data.complaint);
        onClose();
      }
    } catch (err) {
      console.error('Failed to override priority:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">Administrative Priority Override</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Current calculated priority for <span className="font-mono font-semibold text-blue-700">{complaint.id}</span> is{' '}
            <strong>{complaint.priorityScore}/100 ({complaint.priorityLevel})</strong>. As an authorized civic officer, you may manually elevate or deprioritize this issue.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Target Priority Tier
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Low', 'Medium', 'High', 'Critical'] as PriorityLevel[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleLevelChange(p)}
                  className={`py-2 text-xs font-bold rounded-lg border transition ${
                    level === p
                      ? p === 'Critical'
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : p === 'High'
                        ? 'bg-orange-600 text-white border-orange-600 shadow'
                        : p === 'Medium'
                        ? 'bg-amber-600 text-white border-amber-600 shadow'
                        : 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Override Score (0 - 100)
              </label>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {score} / 100
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mandatory Audit Reason / Justification
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. VIP convoy movement route inspection / Emergency hospital arterial road..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Apply Priority Override'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

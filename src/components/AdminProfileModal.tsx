import React from 'react';
import {
  X,
  ShieldAlert,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  Lock,
  Award,
  CheckCircle2,
  Sliders,
  FileText,
} from 'lucide-react';
import { User } from '../types/index.ts';

interface AdminProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-2xl border-2 border-purple-400 shadow-lg">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                'SP'
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">Shreya Pol</h2>
                <span className="text-[10px] bg-purple-400/20 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-xs font-semibold text-purple-300">
                Super Administrator
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pune Municipal Corporation • Central Operations Command
              </p>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Official Administrative Credentials
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Full Name
                </span>
                <span className="font-bold text-slate-900 block text-sm">Shreya Pol</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <Award className="w-3.5 h-3.5 text-purple-600" /> Designated Role
                </span>
                <span className="font-bold text-purple-700 block text-sm">Super Administrator</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-600" /> Official Email
                </span>
                <span className="font-semibold text-slate-800 block truncate" title={user.email}>
                  {user.email || 'shreya.1251070104@vit.edu'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" /> Administrative Ward
                </span>
                <span className="font-semibold text-slate-800 block">PMC Central Command</span>
              </div>
            </div>
          </div>

          {/* Assigned System Privileges */}
          <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-2 text-xs">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-700" />
              <span>Super Administrator Authority Privileges</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-purple-900">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Full Grievance Management</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Priority Score Override</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Field Dispatch & Status Closure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Turnaround Analytics & GIS</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <button
              onClick={onLogout}
              className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
            >
              Sign Out of Portal
            </button>
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

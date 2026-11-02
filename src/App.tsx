import React, { useState, useEffect } from 'react';
import { Complaint, User, ComplaintStatus } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { CitizenDashboard } from './pages/CitizenDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { InteractiveMapPage } from './pages/InteractiveMapPage.tsx';
import { AnalyticsPage } from './pages/AnalyticsPage.tsx';
import { ReportComplaintModal } from './components/ReportComplaintModal.tsx';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal.tsx';
import { PriorityOverrideModal } from './components/PriorityOverrideModal.tsx';

// Pre-configured simulated users for seamless demo switching
const DEMO_USERS: User[] = [
  {
    id: 'user-citizen-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    role: 'citizen',
    phone: '+91 98901 44556',
    ward: 'Shivajinagar',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-citizen-2',
    name: 'Priya Patil',
    email: 'priya.patil@example.com',
    role: 'citizen',
    phone: '+91 94220 77889',
    ward: 'Kothrud',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-admin-1',
    name: 'Shri. Rajesh Deshmukh',
    email: 'admin@pune-civic.gov.in',
    role: 'admin',
    phone: '+91 98220 11223',
    ward: 'PMC Central Command',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [overrideModalComplaint, setOverrideModalComplaint] = useState<Complaint | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (data.complaints) {
        setComplaints(data.complaints);
      }
    } catch (err) {
      console.error('Failed fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    showNotification(`Switched profile to: ${user.name} (${user.role.toUpperCase()})`);
  };

  const handleComplaintSubmitted = (newComplaint: Complaint) => {
    setComplaints((prev) => {
      const index = prev.findIndex((c) => c.id === newComplaint.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = newComplaint;
        return copy;
      }
      return [newComplaint, ...prev];
    });
    showNotification(`Grievance registered: ${newComplaint.id}`);
  };

  const handleComplaintUpdated = (updatedComplaint: Complaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
    );
    setSelectedComplaint(updatedComplaint);
    showNotification(`Ticket updated: ${updatedComplaint.id}`);
  };

  const handleQuickStatusChange = async (complaintId: string, newStatus: ComplaintStatus) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: {
            name: currentUser.name,
            role: 'Admin',
          },
          remarks: `Quick status updated to ${newStatus}`,
        }),
      });

      const data = await res.json();
      if (data.complaint) {
        handleComplaintUpdated(data.complaint);
      }
    } catch (err) {
      console.error('Error changing quick status:', err);
    }
  };

  const handleResetDemoData = async () => {
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      await fetchComplaints();
      showNotification('Pune demo complaints reset to baseline.');
    } catch (err) {
      console.error('Error resetting demo data:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        availableUsers={DEMO_USERS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setReportModalOpen(true)}
        onResetDemoData={handleResetDemoData}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">
                Initializing NagarSetu Civic Engine...
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'landing' && (
              <LandingPage
                complaints={complaints}
                onOpenReportModal={() => setReportModalOpen(true)}
                onNavigateToTab={setActiveTab}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
              />
            )}

            {activeTab === 'citizen' && (
              <CitizenDashboard
                currentUser={currentUser}
                complaints={complaints}
                onOpenReportModal={() => setReportModalOpen(true)}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard
                currentUser={currentUser}
                complaints={complaints}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onOverridePriority={(c) => setOverrideModalComplaint(c)}
                onQuickStatusChange={handleQuickStatusChange}
                onSwitchToAdmin={() => handleSelectUser(DEMO_USERS[2])}
              />
            )}

            {activeTab === 'map' && (
              <InteractiveMapPage
                complaints={complaints}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onOpenReportModal={() => setReportModalOpen(true)}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsPage />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white">NagarSetu</span>
            <span>• Report. Detect. Prioritize. Resolve.</span>
          </div>

          <div className="text-[11px] text-slate-500 text-center md:text-right">
            Demonstration civic intelligence prototype for Pune urban area.
            <br />
            Powered by Google Gemini 3.8 Flash Multimodal Vision • OpenStreetMap
          </div>
        </div>
      </footer>

      {/* Report Complaint Modal */}
      {reportModalOpen && (
        <ReportComplaintModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          currentUser={currentUser}
          onComplaintSubmitted={handleComplaintSubmitted}
        />
      )}

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          currentUser={currentUser}
          onComplaintUpdated={handleComplaintUpdated}
        />
      )}

      {/* Priority Override Modal */}
      {overrideModalComplaint && (
        <PriorityOverrideModal
          complaint={overrideModalComplaint}
          isOpen={!!overrideModalComplaint}
          onClose={() => setOverrideModalComplaint(null)}
          adminName={currentUser.name}
          onOverrideSaved={handleComplaintUpdated}
        />
      )}
    </div>
  );
}

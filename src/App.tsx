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
import { AuthScreen } from './components/AuthScreen.tsx';
import { AdminProfileModal } from './components/AdminProfileModal.tsx';
import { auth, signOut, onAuthStateChanged } from './firebase.ts';
import { Building2 } from 'lucide-react';

// Pre-configured simulated users with Shreya Pol as primary Super Administrator
const DEMO_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Shreya Pol',
    email: 'shreya.1251070104@vit.edu',
    role: 'admin',
    titleRole: 'Super Administrator',
    phone: '+91 98220 11223',
    ward: 'PMC Central Command',
    createdAt: new Date().toISOString(),
  },
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
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState<boolean>(true);

  // Modals
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [overrideModalComplaint, setOverrideModalComplaint] = useState<Complaint | null>(null);
  const [adminProfileOpen, setAdminProfileOpen] = useState<boolean>(false);

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
      setLoadingComplaints(false);
    }
  };

  // Check login session on application load
  useEffect(() => {
    fetchComplaints();

    // 1. Check local session storage
    const savedUserStr = localStorage.getItem('nagarsetu_user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.email) {
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parsed.email }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.user) {
                setCurrentUser(data.user);
                setActiveTab(data.user.role === 'admin' ? 'admin' : 'citizen');
              } else {
                setCurrentUser(parsed);
              }
            })
            .catch(() => setCurrentUser(parsed))
            .finally(() => setIsCheckingSession(false));
          return;
        }
      } catch (e) {
        console.warn('Failed parsing cached session', e);
      }
    }

    // 2. Check Firebase session
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              photoUrl: fbUser.photoURL || undefined,
              uid: fbUser.uid,
            }),
          });
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('nagarsetu_user', JSON.stringify(data.user));
            setActiveTab(data.user.role === 'admin' ? 'admin' : 'citizen');
          }
        } catch (err) {
          console.error('Error syncing auth session', err);
        }
      }
      setIsCheckingSession(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nagarsetu_user', JSON.stringify(user));
    // Redirect based on authenticated role
    if (user.role === 'admin') {
      setActiveTab('admin');
      showNotification(`Welcome, ${user.name} (Super Administrator)`);
    } else {
      setActiveTab('citizen');
      showNotification(`Welcome, ${user.name} (Citizen)`);
    }
  };

  // Demo user login shortcut
  const handleDemoLogin = async (email: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.user) {
        handleLoginSuccess(data.user);
      }
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('nagarsetu_user');
    setCurrentUser(null);
    setAdminProfileOpen(false);
    showNotification('Signed out of NagarSetu.');
  };

  const handleSelectUser = (user: User) => {
    handleLoginSuccess(user);
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
    if (!currentUser) return;

    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: {
            userId: currentUser.id,
            name: currentUser.name,
            role: 'Admin',
          },
          remarks: `Status updated to ${newStatus} by ${currentUser.name}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || 'Permission denied: Admin privileges required.');
        return;
      }
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

  // 1. Loading screen while checking authentication session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-['Plus_Jakarta_Sans'] p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25 border border-blue-400/40">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="font-bold text-base">NagarSetu</h3>
            <p className="text-xs text-slate-400">Verifying civic authentication session...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. First-Open Authentication Screen (if not logged in)
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
        onDemoLogin={handleDemoLogin}
      />
    );
  }

  // 3. Authenticated NagarSetu Application
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
        onLogout={handleLogout}
        onOpenProfileModal={() => setAdminProfileOpen(true)}
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
        {loadingComplaints ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">
                Loading NagarSetu Civic Engine Data...
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
                onSwitchToAdmin={() => handleDemoLogin('shreya.1251070104@vit.edu')}
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
            Super Administrator: <strong className="text-slate-300">Shreya Pol</strong> • Pune Municipal Corporation
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

      {/* Admin Profile Modal */}
      {adminProfileOpen && (
        <AdminProfileModal
          user={currentUser}
          isOpen={adminProfileOpen}
          onClose={() => setAdminProfileOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Wifi, 
  BatteryMedium, 
  Signal, 
  ChevronLeft,
  Smartphone
} from 'lucide-react';
import type { 
  User, 
  Tournament, 
  WalletTransaction, 
  NotificationItem, 
  Complaint, 
  OrganizerStats, 
  AdminStats, 
  GameCategory,
  UserRole
} from './types/index.ts';
import { api } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { BottomNav, NavTab } from './components/BottomNav.tsx';
import { HomeView } from './components/HomeView.tsx';
import { ExploreView } from './components/ExploreView.tsx';
import { CreateTournamentView } from './components/CreateTournamentView.tsx';
import { MyTournamentsView } from './components/MyTournamentsView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { OrganizerEarningsView } from './components/OrganizerEarningsView.tsx';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { TournamentDetailsModal } from './components/TournamentDetailsModal.tsx';
import { WalletModal } from './components/WalletModal.tsx';
import { LegalModal } from './components/LegalModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { ComplaintModal } from './components/ComplaintModal.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [organizerStats, setOrganizerStats] = useState<OrganizerStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'All'>('All');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Modals
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Android Viewport Simulation Frame Toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [u, tList, notifs] = await Promise.all([
        api.getCurrentUser(),
        api.getTournaments(),
        api.getNotifications()
      ]);
      setCurrentUser(u);
      setTournaments(tList);
      setNotifications(notifs);

      // Load wallet
      const w = await api.getWallet();
      setTransactions(w.transactions);

      // Load organizer & admin data
      const [org, adm, uList, comp] = await Promise.all([
        api.getOrganizerStats(),
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminComplaints()
      ]);
      setOrganizerStats(org.stats);
      setAdminStats(adm);
      setAdminUsers(uList);
      setComplaints(comp);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Role persona switcher
  const handleSwitchRole = async (role: UserRole) => {
    try {
      const updatedUser = await api.switchRole(role);
      setCurrentUser(updatedUser);
      // Auto route to view matching role
      if (role === 'organizer') setCurrentTab('organizer');
      else if (role === 'admin') setCurrentTab('admin');
      else setCurrentTab('home');

      // Refresh wallet & tournaments
      const [tList, w] = await Promise.all([
        api.getTournaments(),
        api.getWallet()
      ]);
      setTournaments(tList);
      setTransactions(w.transactions);
    } catch (err) {
      console.error('Error switching role:', err);
    }
  };

  // Join Tournament
  const handleJoinTournament = async (id: string, payload: { teamName?: string; inGameName: string; inGameId: string }) => {
    const res = await api.joinTournament(id, payload);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    // Refresh user & tournaments
    await loadInitialData();
    const updated = await api.getTournament(id);
    setSelectedTournament(updated);
  };

  // Create Tournament
  const handleCreateTournament = async (payload: Partial<Tournament>) => {
    const created = await api.createTournament(payload);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    await loadInitialData();
    return created;
  };

  // Advance Bracket
  const handleAdvanceBracket = async (tournamentId: string, payload: { matchId: string; winnerId: string; team1Score?: number; team2Score?: number }) => {
    await api.advanceBracket(tournamentId, payload);
    const updated = await api.getTournament(tournamentId);
    setSelectedTournament(updated);
    const allT = await api.getTournaments();
    setTournaments(allT);
  };

  // Submit Results
  const handleSubmitResults = async (tournamentId: string, payload: any) => {
    await api.submitTournamentResults(tournamentId, payload);
    const updated = await api.getTournament(tournamentId);
    setSelectedTournament(updated);
    const allT = await api.getTournaments();
    setTournaments(allT);
  };

  // Admin Approve Prizes
  const handleApprovePrizes = async (tournamentId: string) => {
    await api.approveTournamentPrizes(tournamentId);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 }
    });
    await loadInitialData();
    const updated = await api.getTournament(tournamentId);
    setSelectedTournament(updated);
  };

  // Wallet actions
  const handleInitiateDeposit = async (amount: number, upiApp: string) => {
    return api.initiateUpiDeposit(amount, upiApp);
  };

  const handleWithdraw = async (amount: number, upiId: string) => {
    const res = await api.withdrawWinnings(amount, upiId);
    await loadInitialData();
    return res;
  };

  // Notifications
  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Complaints
  const handleSubmitComplaint = async (payload: Partial<Complaint>) => {
    const res = await api.submitComplaint(payload);
    const comp = await api.getAdminComplaints();
    setComplaints(comp);
    return res;
  };

  const handleResolveComplaint = async (id: string, note: string) => {
    await api.resolveComplaint(id, note);
    const comp = await api.getAdminComplaints();
    setComplaints(comp);
  };

  // Admin User status
  const handleToggleUserStatus = async (userId: string, newStatus: 'active' | 'suspended') => {
    await api.setAdminUserStatus(userId, newStatus);
    const uList = await api.getAdminUsers();
    setAdminUsers(uList);
  };

  const handleApproveOrganizer = async (userId: string) => {
    await api.approveOrganizer(userId);
    const uList = await api.getAdminUsers();
    setAdminUsers(uList);
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen bg-[#06080e] text-slate-100 flex flex-col ${isMobileFrame ? 'items-center justify-center p-0 sm:py-6' : ''}`}>
      {/* Outer Shell for Desktop vs Android Phone Frame */}
      <div className={`w-full flex flex-col bg-[#07090e] transition-all duration-300 ${
        isMobileFrame 
          ? 'max-w-[420px] rounded-[38px] border-[6px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden relative min-h-[844px] max-h-[92vh]' 
          : 'min-h-screen'
      }`}>
        
        {/* Android Smartphone Top Status Bar (Only in Mobile Frame mode) */}
        {isMobileFrame && (
          <div className="bg-[#090d16] px-6 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none shrink-0 border-b border-slate-900">
            <span className="font-semibold text-white">12:45</span>
            {/* Center camera notch pinhole */}
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 shadow-inner" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <Signal className="w-3 h-3" />
              <span className="text-[9px] font-bold">5G</span>
              <Wifi className="w-3 h-3" />
              <BatteryMedium className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Top Header */}
        <Header
          user={currentUser}
          unreadCount={unreadNotifsCount}
          onOpenWallet={() => setShowWalletModal(true)}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onOpenLegal={() => setShowLegalModal(true)}
          onSwitchRole={handleSwitchRole}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
          onOpenProfile={() => setCurrentTab('profile')}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">Loading BRACKORA Arena...</span>
            </div>
          ) : (
            <>
              {currentTab === 'home' && (
                <HomeView
                  tournaments={tournaments}
                  onSelectTournament={(t) => setSelectedTournament(t)}
                  onSelectCategory={(cat) => setSelectedCategory(cat)}
                  selectedCategory={selectedCategory}
                  onNavigateToCreate={() => setCurrentTab('create')}
                  onOpenWallet={() => setShowWalletModal(true)}
                />
              )}

              {currentTab === 'explore' && (
                <ExploreView
                  tournaments={tournaments}
                  onSelectTournament={(t) => setSelectedTournament(t)}
                />
              )}

              {currentTab === 'create' && (
                <CreateTournamentView
                  onCreateTournament={handleCreateTournament}
                  onSuccess={(created) => {
                    setSelectedTournament(created);
                    setCurrentTab('my-tournaments');
                  }}
                  onCancel={() => setCurrentTab('home')}
                />
              )}

              {currentTab === 'my-tournaments' && (
                <MyTournamentsView
                  tournaments={tournaments}
                  currentUser={currentUser}
                  onSelectTournament={(t) => setSelectedTournament(t)}
                  onNavigateToCreate={() => setCurrentTab('create')}
                />
              )}

              {currentTab === 'profile' && currentUser && (
                <ProfileView
                  user={currentUser}
                  onOpenWallet={() => setShowWalletModal(true)}
                  onOpenOrganizerHub={() => setCurrentTab('organizer')}
                  onOpenAdminHub={() => setCurrentTab('admin')}
                  onOpenLegal={() => setShowLegalModal(true)}
                  onOpenComplaintModal={() => setShowComplaintModal(true)}
                  onOpenAuthModal={() => setShowAuthModal(true)}
                  onUpdateProfile={async (p) => {
                    const u = await api.updateProfile(p);
                    setCurrentUser(u);
                  }}
                  onSwitchRole={handleSwitchRole}
                />
              )}

              {currentTab === 'organizer' && (
                <OrganizerEarningsView
                  stats={organizerStats}
                  tournaments={tournaments}
                  currentUser={currentUser}
                  onNavigateToCreate={() => setCurrentTab('create')}
                  onOpenWallet={() => setShowWalletModal(true)}
                />
              )}

              {currentTab === 'admin' && (
                <AdminDashboardView
                  stats={adminStats}
                  users={adminUsers}
                  tournaments={tournaments}
                  complaints={complaints}
                  transactions={transactions}
                  onToggleUserStatus={handleToggleUserStatus}
                  onApproveOrganizer={handleApproveOrganizer}
                  onApprovePrizes={handleApprovePrizes}
                  onResolveComplaint={handleResolveComplaint}
                  onSelectTournament={(t) => setSelectedTournament(t)}
                />
              )}
            </>
          )}
        </main>

        {/* Android Home Navigation Gesture Bar (when in mobile frame) */}
        {isMobileFrame && (
          <div className="h-4 bg-[#090d16] flex items-center justify-center shrink-0">
            <div className="w-28 h-1 bg-slate-600 rounded-full" />
          </div>
        )}

        {/* Bottom Tab Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          userRole={currentUser?.role}
        />
      </div>

      {/* MODALS */}
      {selectedTournament && (
        <TournamentDetailsModal
          tournament={selectedTournament}
          currentUser={currentUser}
          onClose={() => setSelectedTournament(null)}
          onJoinTournament={handleJoinTournament}
          onAdvanceBracket={handleAdvanceBracket}
          onSubmitResults={handleSubmitResults}
          onApprovePrizes={handleApprovePrizes}
          onOpenWallet={() => {
            setSelectedTournament(null);
            setShowWalletModal(true);
          }}
          onOpenLegal={() => setShowLegalModal(true)}
        />
      )}

      {showWalletModal && currentUser && (
        <WalletModal
          user={currentUser}
          transactions={transactions}
          onClose={() => setShowWalletModal(false)}
          onInitiateDeposit={handleInitiateDeposit}
          onWithdraw={handleWithdraw}
          onRefreshWallet={async () => {
            const [u, w] = await Promise.all([api.getCurrentUser(), api.getWallet()]);
            setCurrentUser(u);
            setTransactions(w.transactions);
          }}
          onOpenLegal={() => setShowLegalModal(true)}
        />
      )}

      {showLegalModal && (
        <LegalModal onClose={() => setShowLegalModal(false)} />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSendOtp={api.sendOtp}
          onVerifyOtp={api.verifyOtp}
          onGoogleLogin={api.loginWithGoogle}
          onLoginSuccess={(u) => {
            setCurrentUser(u);
            loadInitialData();
          }}
        />
      )}

      {showNotificationsModal && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />
      )}

      {showComplaintModal && (
        <ComplaintModal
          onClose={() => setShowComplaintModal(false)}
          onSubmitComplaint={handleSubmitComplaint}
        />
      )}
    </div>
  );
}

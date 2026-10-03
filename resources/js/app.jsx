import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RequestFormPage from './pages/RequestFormPage';
import TrackingPage from './pages/TrackingPage';
import ApprovalsPage from './pages/ApprovalsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import StockManagementPage from './pages/StockManagementPage';

function AppContent() {
    const { user, loading } = useAuth();
    const [currentTab, setCurrentTabState] = useState(
        () => localStorage.getItem('sapt_active_tab') || 'dashboard'
    );
    const [selectedServiceCode, setSelectedServiceCode] = useState('D');
    const [selectedPermohonanId, setSelectedPermohonanId] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const prevUserRef = React.useRef(user);

    // Dapatkan menu paling atas di sidebar sesuai role
    const getTopMenuTab = (role) => {
        return role === 'PIC' ? 'tracking' : 'dashboard';
    };

    const setCurrentTab = (tab) => {
        let targetTab = tab;
        // PIC role cannot access dashboard or request-form
        if (user?.role === 'PIC' && (tab === 'dashboard' || tab === 'request-form')) {
            targetTab = 'tracking';
        }
        localStorage.setItem('sapt_active_tab', targetTab);
        setCurrentTabState(targetTab);
    };

    // GUEST & ROLE PROTECTIONS & LOGIN REDIRECTIONS:
    React.useEffect(() => {
        if (!loading) {
            // Ketika baru saja login (transisi dari belum login ke sudah login):
            // langsung arahkan ke menu utama paling atas sidebar
            if (!prevUserRef.current && user) {
                setCurrentTab(getTopMenuTab(user.role));
            }
            // Guest redirected to login if accessing protected tabs
            else if (!user && currentTab !== 'dashboard' && currentTab !== 'login') {
                setCurrentTab('login');
            }
            // PIC cannot access dashboard or request-form because PIC cannot create requests
            else if (user?.role === 'PIC' && (currentTab === 'dashboard' || currentTab === 'request-form')) {
                setCurrentTab('tracking');
            }
        }
        prevUserRef.current = user;
    }, [user, currentTab, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-green-300 font-bold tracking-wider">Memuat Sistem Layanan Marketing...</p>
                </div>
            </div>
        );
    }

    if (!user && currentTab === 'login') {
        return (
            <LoginPage
                onBackToGuest={() => setCurrentTab('dashboard')}
                onSuccess={(loggedInUser) => {
                    setCurrentTab(getTopMenuTab(loggedInUser?.role));
                }}
            />
        );
    }

    const handleSelectService = (code) => {
        setSelectedServiceCode(code);
        setCurrentTab('request-form');
    };

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                currentTab={currentTab}
                setCurrentTab={(tab) => {
                    setSelectedPermohonanId(null);
                    setCurrentTab(tab);
                }}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Bar */}
                <TopBar
                    currentTab={currentTab}
                    setCurrentTab={(tab) => {
                        setSelectedPermohonanId(null);
                        setCurrentTab(tab);
                    }}
                    onMobileMenuOpen={() => setMobileOpen(true)}
                />

                {/* Scrollable content area with sticky/natural bottom footer */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="min-h-full flex flex-col">
                        <main className="flex-1">
                            {currentTab === 'dashboard' && (
                                <DashboardPage
                                    onSelectService={handleSelectService}
                                    onGoToTracking={() => setCurrentTab('tracking')}
                                />
                            )}

                            {currentTab === 'request-form' && (
                                <RequestFormPage
                                    serviceCode={selectedServiceCode}
                                    onBack={() => setCurrentTab('dashboard')}
                                    onSuccess={() => setCurrentTab('tracking')}
                                />
                            )}

                            {currentTab === 'tracking' && (
                                <TrackingPage defaultSelectedId={selectedPermohonanId} />
                            )}

                            {currentTab === 'approvals' && (
                                <ApprovalsPage onOpenTracking={() => setCurrentTab('tracking')} />
                            )}

                            {currentTab === 'analytics' && (
                                <AnalyticsPage />
                            )}

                            {currentTab === 'stock' && (
                                <StockManagementPage initialTab="suvenir" />
                            )}

                            {currentTab === 'inventory-multimedia' && (
                                <StockManagementPage initialTab="multimedia" />
                            )}

                            {currentTab === 'settings' && (
                                <SettingsPage />
                            )}

                            {currentTab === 'users' && (
                                <UserManagementPage />
                            )}
                        </main>

                        {/* Footer */}
                        <footer className="mt-auto shrink-0 border-t border-slate-200/80 bg-white py-4">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
                                <p>© 2026 Sistem Layanan Marketing — Universitas YARSI</p>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

const rootEl = document.getElementById('root');
if (rootEl) {
    createRoot(rootEl).render(<App />);
}

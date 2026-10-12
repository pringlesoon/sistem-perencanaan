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
import RoomSchedulePage from './pages/RoomSchedulePage';

// Validasi apakah sebuah tab diizinkan untuk user tertentu
function isTabAllowed(tab, user) {
    if (!tab) return false;
    const role = user?.role || 'Guest';
    const fallbackPicMap = { ahmad: 'D', nurhaliza: 'P', bagas: 'S', dewi: 'M', rizky: 'L' };
    const picCode = user?.pic_service_code || fallbackPicMap[user?.username?.toLowerCase()] || null;

    if (!user) {
        return ['dashboard', 'login'].includes(tab);
    }

    if (role === 'PIC') {
        if (['dashboard', 'request-form'].includes(tab)) return false;
        if (tab === 'approvals' && picCode !== 'S') return false;
        if (tab === 'stock' && picCode !== 'S') return false;
        if (tab === 'inventory-multimedia' && picCode !== 'M') return false;
        if (tab === 'schedule-slots' && picCode !== 'M') return false;
        if (['settings', 'users'].includes(tab)) return false;
        return true;
    }

    if (role === 'User') {
        return ['dashboard', 'tracking', 'schedule-slots', 'request-form'].includes(tab);
    }

    if (role === 'Admin') {
        return ['dashboard', 'tracking', 'schedule-slots', 'analytics', 'stock', 'inventory-multimedia', 'settings', 'request-form'].includes(tab);
    }

    if (role === 'SuperAdmin') {
        return true;
    }

    return true;
}

function AppContent() {
    const { user, loading } = useAuth();
    
    // Inisialisasi tab: utamakan hash URL, kemudian localStorage, default 'dashboard'
    const [currentTab, setCurrentTabState] = useState(() => {
        const hash = window.location.hash.replace(/^#\/?/, '').trim();
        if (hash.startsWith('request-form')) {
            return 'request-form';
        }
        const saved = localStorage.getItem('sapt_active_tab');
        return hash || saved || 'dashboard';
    });

    const [selectedServiceCode, setSelectedServiceCode] = useState(() => {
        const hash = window.location.hash.replace(/^#\/?/, '').trim();
        if (hash.startsWith('request-form/')) {
            const code = hash.split('/')[1]?.toUpperCase();
            if (['D', 'P', 'S', 'M', 'L'].includes(code)) {
                return code;
            }
        }
        const saved = localStorage.getItem('sapt_active_service');
        if (saved && ['D', 'P', 'S', 'M', 'L'].includes(saved)) {
            return saved;
        }
        return 'D';
    });
    const [selectedPermohonanId, setSelectedPermohonanId] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Simpan tujuan redirect setelah login jika user belum terotentikasi
    const [redirectTarget, setRedirectTarget] = useState(() => {
        try {
            const saved = sessionStorage.getItem('sapt_redirect_after_login');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const saveRedirectTarget = (target) => {
        setRedirectTarget(target);
        try {
            if (target) {
                sessionStorage.setItem('sapt_redirect_after_login', JSON.stringify(target));
            } else {
                sessionStorage.removeItem('sapt_redirect_after_login');
            }
        } catch (e) {}
    };

    const clearRedirectTarget = () => {
        setRedirectTarget(null);
        try {
            sessionStorage.removeItem('sapt_redirect_after_login');
        } catch (e) {}
    };

    // Dapatkan menu paling atas di sidebar sesuai role
    const getTopMenuTab = (role) => {
        return role === 'PIC' ? 'tracking' : 'dashboard';
    };

    const setCurrentTab = (tab, serviceCode = null, currentUser = user) => {
        let targetTab = tab;
        const activeUser = currentUser || user;

        // Jika user belum login dan mencoba mengakses tab yang protected (bukan dashboard atau login)
        if (!activeUser && tab !== 'dashboard' && tab !== 'login') {
            const codeToSave = serviceCode || (tab === 'request-form' ? selectedServiceCode : null);
            const target = {
                tab: tab,
                serviceCode: codeToSave,
                permohonanId: selectedPermohonanId,
            };
            saveRedirectTarget(target);

            localStorage.setItem('sapt_active_tab', 'login');
            try {
                window.location.hash = 'login';
            } catch (e) {}
            setCurrentTabState('login');
            return;
        }

        // PIC role cannot access dashboard or request-form
        if (activeUser?.role === 'PIC' && (tab === 'dashboard' || tab === 'request-form')) {
            targetTab = 'tracking';
        }
        localStorage.setItem('sapt_active_tab', targetTab);

        const codeToUse = serviceCode || selectedServiceCode;
        if (targetTab === 'request-form') {
            setSelectedServiceCode(codeToUse);
            localStorage.setItem('sapt_active_service', codeToUse);
            try {
                window.location.hash = `request-form/${codeToUse}`;
            } catch (e) {}
        } else {
            try {
                window.location.hash = targetTab;
            } catch (e) {}
        }
        setCurrentTabState(targetTab);
    };

    // Sinkronisasi perubahan hash browser (misal tombol Back/Forward browser)
    React.useEffect(() => {
        const handleHashChange = () => {
            const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
            if (!rawHash) return;

            let targetTab = rawHash;
            let targetService = null;

            if (rawHash.startsWith('request-form/')) {
                targetTab = 'request-form';
                targetService = rawHash.split('/')[1]?.toUpperCase();
            } else if (rawHash.startsWith('request-form')) {
                targetTab = 'request-form';
            }

            if (targetService && ['D', 'P', 'S', 'M', 'L'].includes(targetService)) {
                setSelectedServiceCode(targetService);
                localStorage.setItem('sapt_active_service', targetService);
            }

            // Jika guest mencoba mengakses protected tab via hash URL
            if (!user && targetTab !== 'dashboard' && targetTab !== 'login') {
                const target = {
                    tab: targetTab,
                    serviceCode: targetService || selectedServiceCode,
                    permohonanId: null,
                };
                saveRedirectTarget(target);
                setCurrentTabState('login');
                localStorage.setItem('sapt_active_tab', 'login');
                try {
                    window.location.hash = 'login';
                } catch (e) {}
                return;
            }

            if (targetTab !== currentTab && isTabAllowed(targetTab, user)) {
                setCurrentTabState(targetTab);
                localStorage.setItem('sapt_active_tab', targetTab);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [currentTab, user, selectedServiceCode]);

    // PROTEKSI ROLE & VALIDASI TAB:
    React.useEffect(() => {
        if (!loading) {
            // Guest handling:
            if (!user) {
                // Jika tidak ada hash di URL dan tab saat ini berasal dari cache yang bukan dashboard/login
                // dan belum ada redirectTarget yang sengaja disimpan, kembalikan ke dashboard
                const hash = window.location.hash.replace(/^#\/?/, '').trim();
                if (!hash && !sessionStorage.getItem('sapt_redirect_after_login')) {
                    if (currentTab !== 'dashboard' && currentTab !== 'login') {
                        setCurrentTabState('dashboard');
                        localStorage.setItem('sapt_active_tab', 'dashboard');
                        return;
                    }
                }

                // Guest redirected to login jika mengakses tab protected
                if (currentTab !== 'dashboard' && currentTab !== 'login') {
                    const target = {
                        tab: currentTab,
                        serviceCode: currentTab === 'request-form' ? selectedServiceCode : null,
                        permohonanId: selectedPermohonanId,
                    };
                    saveRedirectTarget(target);
                    setCurrentTab('login');
                }
            }
            // PIC cannot access dashboard or request-form
            else if (user?.role === 'PIC' && (currentTab === 'dashboard' || currentTab === 'request-form')) {
                setCurrentTab('tracking');
            }
            // Jika user mencoba mengakses tab yang tidak diizinkan untuk rolenya
            else if (user && !isTabAllowed(currentTab, user)) {
                setCurrentTab(getTopMenuTab(user.role));
            }
            // Tab valid: pastikan tersimpan di localStorage dan hash
            else if (user) {
                localStorage.setItem('sapt_active_tab', currentTab);
                try {
                    if (currentTab === 'request-form') {
                        window.location.hash = `request-form/${selectedServiceCode}`;
                        localStorage.setItem('sapt_active_service', selectedServiceCode);
                    } else {
                        window.location.hash = currentTab;
                    }
                } catch (e) {}
            }
        }
    }, [user, currentTab, loading, selectedServiceCode]);

    const handleLoginSuccess = (loggedInUser) => {
        let target = redirectTarget;
        if (!target) {
            try {
                const saved = sessionStorage.getItem('sapt_redirect_after_login');
                if (saved) target = JSON.parse(saved);
            } catch (e) {}
        }

        clearRedirectTarget();

        // Jika ada target spesifik dan user diizinkan mengakses tab tersebut
        if (target && target.tab && isTabAllowed(target.tab, loggedInUser)) {
            if (target.tab === 'request-form') {
                const code = target.serviceCode || selectedServiceCode || 'D';
                setSelectedServiceCode(code);
                localStorage.setItem('sapt_active_service', code);
                setCurrentTab('request-form', code, loggedInUser);
                return;
            }

            if (target.tab === 'tracking' && target.permohonanId) {
                setSelectedPermohonanId(target.permohonanId);
            }

            setCurrentTab(target.tab, null, loggedInUser);
            return;
        }

        // Default sesuai role (tracking untuk PIC, dashboard untuk lainnya)
        setCurrentTab(getTopMenuTab(loggedInUser?.role), null, loggedInUser);
    };

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
                onBackToGuest={() => {
                    clearRedirectTarget();
                    setCurrentTab('dashboard');
                }}
                redirectTarget={redirectTarget}
                onSuccess={(loggedInUser) => {
                    handleLoginSuccess(loggedInUser);
                }}
            />
        );
    }

    const handleSelectService = (code) => {
        setSelectedServiceCode(code);
        localStorage.setItem('sapt_active_service', code);
        setCurrentTab('request-form', code);
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

                            {currentTab === 'schedule-slots' && (
                                <RoomSchedulePage
                                    onNavigateToRequest={(serviceCode = 'M') => {
                                        setSelectedServiceCode(serviceCode);
                                        localStorage.setItem('sapt_active_service', serviceCode);
                                        setCurrentTab('request-form', serviceCode);
                                    }}
                                    onOpenTrackingDetail={(id) => {
                                        setSelectedPermohonanId(id);
                                        setCurrentTab('tracking');
                                    }}
                                />
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

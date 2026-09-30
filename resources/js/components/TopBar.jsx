import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { ChevronDown, LogOut, Menu, Shield, User } from 'lucide-react';

// Page titles map
const PAGE_TITLES = {
    dashboard: { title: 'Dasbor Utama', subtitle: 'Selamat datang di SLM YARSI' },
    tracking: { title: 'Tracking Permohonan', subtitle: 'Pantau status semua permohonan' },
    approvals: { title: 'Antrean Approval', subtitle: 'Kelola persetujuan permohonan' },
    analytics: { title: 'Dasbor Analitik', subtitle: 'Laporan dan statistik layanan' },
    settings: { title: 'Kelola Layanan', subtitle: 'Konfigurasi layanan sistem' },
    users: { title: 'Kelola Pengguna', subtitle: 'Manajemen pengguna & PIC layanan' },
    stock: { title: 'Manajemen Stok', subtitle: 'Inventaris alat promosi & suvenir' },
    'request-form': { title: 'Form Permohonan', subtitle: 'Ajukan permohonan baru' },
};

const roleBadgeColors = {
    User: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    SuperAdmin: 'bg-violet-50 text-violet-700 border-violet-200',
    PIC: 'bg-green-50 text-green-700 border-green-200',
};

const picServiceLabels = {
    D: 'PIC Desain',
    P: 'PIC Publikasi',
    S: 'PIC Alat Promosi',
    M: 'PIC Multimedia',
    L: 'PIC Liputan',
};

export default function TopBar({ currentTab, setCurrentTab, onMobileMenuOpen }) {
    const { user, logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const page = PAGE_TITLES[currentTab] || { title: 'SLM YARSI', subtitle: '' };

    const roleBadgeColor = roleBadgeColors[user?.role] || 'bg-slate-100 text-slate-700';

    const roleLabel = user?.role === 'PIC' && user?.pic_service_code
        ? picServiceLabels[user.pic_service_code] || 'PIC'
        : user?.role === 'SuperAdmin' ? 'Super Admin'
        : user?.role;

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);


    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
            <div className="flex items-center justify-between h-14 px-4 md:px-6">
                {/* Left: Mobile menu toggle + Page title */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onMobileMenuOpen}
                        className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div>
                        <h1 className="text-sm font-bold text-slate-900 leading-tight">{page.title}</h1>
                        <p className="text-[11px] text-slate-500 hidden sm:block">{page.subtitle}</p>
                    </div>
                </div>

                {/* Right: Tools */}
                <div className="flex items-center space-x-2">
                    {/* Notification Bell */}
                    <NotificationBell
                        onOpenPermohonan={() => setCurrentTab('tracking')}
                        placement="navbar"
                    />

                    {/* User Profile or Login Button */}
                    {!user ? (
                        <button
                            onClick={() => setCurrentTab('login')}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                        >
                            Login
                        </button>
                    ) : (
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center space-x-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                            >
                                <div className="w-7 h-7 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{user.name}</p>
                                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadgeColor}`}>
                                        {roleLabel}
                                    </span>
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                                        <p className="text-[11px] text-slate-500">{user.email}</p>
                                        <p className="text-[10px] text-green-600 font-medium mt-1">{user.unit_kerja}</p>
                                        <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadgeColor}`}>
                                            {roleLabel}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => { setProfileOpen(false); logout(); setCurrentTab('dashboard'); }}
                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Keluar (Logout)</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { ChevronDown, LogOut, Sparkles, Menu } from 'lucide-react';

// Page titles map
const PAGE_TITLES = {
    dashboard: { title: 'Dasbor Utama', subtitle: 'Selamat datang di SLM YARSI' },
    tracking: { title: 'Tracking Permohonan', subtitle: 'Pantau status semua permohonan' },
    approvals: { title: 'Antrean Approval', subtitle: 'Kelola persetujuan permohonan' },
    analytics: { title: 'Dasbor Analitik', subtitle: 'Laporan dan statistik layanan' },
    settings: { title: 'Kelola Layanan', subtitle: 'Konfigurasi layanan sistem' },
    'request-form': { title: 'Form Permohonan', subtitle: 'Ajukan permohonan baru' },
};

export default function TopBar({ currentTab, setCurrentTab, onMobileMenuOpen }) {
    const { user, logout, quickSwitch } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [switcherOpen, setSwitcherOpen] = useState(false);
    const profileRef = useRef(null);
    const switcherRef = useRef(null);

    const page = PAGE_TITLES[currentTab] || { title: 'SLM YARSI', subtitle: '' };

    const roleBadgeColor = {
        User: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        Approver: 'bg-purple-50 text-purple-700 border-purple-200',
        Verificator: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    }[user?.role] || 'bg-slate-100 text-slate-700';

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
            if (switcherRef.current && !switcherRef.current.contains(e.target)) setSwitcherOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!user) return null;

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
                    {/* Demo Switcher */}
                    <div className="relative" ref={switcherRef}>
                        <button
                            onClick={() => setSwitcherOpen(!switcherOpen)}
                            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                            title="Beralih persona demo"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="hidden sm:inline">Ganti Akun Demo</span>
                            <ChevronDown className={`w-3 h-3 text-amber-700 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {switcherOpen && (
                            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                                <div className="px-3 py-1.5 border-b border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Persona</p>
                                </div>
                                {[
                                    { user: 'andi', name: 'Andi Saputra', role: 'User', tab: 'dashboard', color: 'emerald' },
                                    { user: 'sari', name: 'Sari Wulandari', role: 'Admin', tab: 'tracking', color: 'indigo' },
                                    { user: 'budi', name: 'Dr. Budi Santoso', role: 'Approver', tab: 'approvals', color: 'purple' },
                                    { user: 'dina', name: 'Dina Mariana', role: 'Verificator', tab: 'approvals', color: 'cyan' },
                                ].map(p => (
                                    <button
                                        key={p.user}
                                        onClick={() => { quickSwitch(p.user); setSwitcherOpen(false); setCurrentTab(p.tab); }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors ${user.username === p.user ? `bg-${p.color}-50 font-bold text-${p.color}-700` : 'text-slate-700'}`}
                                    >
                                        <div>
                                            <p className="font-semibold">{p.name}</p>
                                            <p className="text-[10px] text-slate-500">Role: {p.role}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${p.color}-100 text-${p.color}-700 font-semibold`}>{p.role}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notification Bell — drops DOWN with full space in main content area */}
                    <NotificationBell
                        onOpenPermohonan={() => setCurrentTab('tracking')}
                        placement="navbar"
                    />

                    {/* User Profile */}
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
                                    {user.role}
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
                                </div>
                                <button
                                    onClick={() => { setProfileOpen(false); logout(); }}
                                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Keluar (Logout)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

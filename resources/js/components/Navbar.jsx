import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { 
    LayoutDashboard, 
    FileText, 
    ListOrdered, 
    CheckSquare, 
    BarChart3, 
    Settings, 
    LogOut, 
    User, 
    ChevronDown,
    Sparkles,
    Shield
} from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab }) {
    const { user, logout, quickSwitch } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [switcherOpen, setSwitcherOpen] = useState(false);

    if (!user) return null;

    const navItems = [
        { id: 'dashboard', label: 'Dasbor Utama', icon: LayoutDashboard, roles: ['User', 'Admin', 'Approver', 'Verificator'] },
        { id: 'tracking', label: 'Tracking Permohonan', icon: ListOrdered, roles: ['User', 'Admin', 'Approver', 'Verificator'] },
        { id: 'approvals', label: 'Antrean Approval', icon: CheckSquare, roles: ['Approver', 'Admin', 'Verificator'] },
        { id: 'analytics', label: 'Dasbor Analitik', icon: BarChart3, roles: ['Admin', 'Approver'] },
        { id: 'settings', label: 'Kelola Layanan', icon: Settings, roles: ['Admin'] },
    ];

    const roleBadgeColor = {
        User: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        Approver: 'bg-purple-50 text-purple-700 border-purple-200',
        Verificator: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    }[user.role] || 'bg-slate-100 text-slate-700';

    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-md shadow-indigo-100 text-white font-bold text-lg">
                            S
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-900 tracking-tight text-lg">SAPT</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">MVP v1.0</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium hidden sm:block">Sistem Aplikasi Permohonan Terpusat</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navItems
                            .filter(item => item.roles.includes(user.role))
                            .map(item => {
                                const Icon = item.icon;
                                const isActive = currentTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentTab(item.id)}
                                        className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                    </nav>

                    {/* Right Tools: Demo Quick Switch, Notif Bell, User Info */}
                    <div className="flex items-center space-x-3">
                        {/* Demo Quick Persona Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setSwitcherOpen(!switcherOpen)}
                                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                                title="Beralih peran untuk demo"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span className="hidden sm:inline">Ganti Akun Demo</span>
                                <ChevronDown className="w-3 h-3 text-amber-700" />
                            </button>

                            {switcherOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <div className="px-3 py-1.5 border-b border-slate-100">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pilih Persona PRD</p>
                                    </div>
                                    <button
                                        onClick={() => { quickSwitch('andi'); setSwitcherOpen(false); setCurrentTab('dashboard'); }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${user.username === 'andi' ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700'}`}
                                    >
                                        <div>
                                            <p className="font-semibold">Andi Saputra</p>
                                            <p className="text-[10px] text-slate-500">Role: User (Pemohon)</p>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">User</span>
                                    </button>
                                    <button
                                        onClick={() => { quickSwitch('sari'); setSwitcherOpen(false); setCurrentTab('tracking'); }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${user.username === 'sari' ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700'}`}
                                    >
                                        <div>
                                            <p className="font-semibold">Sari Wulandari</p>
                                            <p className="text-[10px] text-slate-500">Role: Admin / Pelaksana Humas</p>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">Admin</span>
                                    </button>
                                    <button
                                        onClick={() => { quickSwitch('budi'); setSwitcherOpen(false); setCurrentTab('approvals'); }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${user.username === 'budi' ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700'}`}
                                    >
                                        <div>
                                            <p className="font-semibold">Dr. Budi Santoso</p>
                                            <p className="text-[10px] text-slate-500">Role: Approver (Kepala Divisi)</p>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Approver</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* In-App Notifications */}
                        <NotificationBell onOpenPermohonan={(id) => {
                            setCurrentTab('tracking');
                        }} />

                        {/* User Profile Pill */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadgeColor}`}>
                                        {user.role}
                                    </span>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                                        <p className="text-[11px] text-slate-500">{user.email}</p>
                                        <p className="text-[10px] text-indigo-600 font-medium mt-1">{user.unit_kerja}</p>
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
            </div>

            {/* Mobile Nav Bar */}
            <div className="md:hidden border-t border-slate-200 bg-white px-2 py-1.5 flex justify-around">
                {navItems
                    .filter(item => item.roles.includes(user.role))
                    .map(item => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentTab(item.id)}
                                className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold rounded-lg ${
                                    isActive ? 'text-indigo-600' : 'text-slate-500'
                                }`}
                            >
                                <Icon className="w-5 h-5 mb-0.5" />
                                <span>{item.label.split(' ')[0]}</span>
                            </button>
                        );
                    })}
            </div>
        </header>
    );
}

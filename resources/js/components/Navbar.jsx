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
    Shield,
    Users
} from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab }) {
    const { user, logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);

    if (!user) return null;

    const role = user.role;
    const picCode = user.pic_service_code;

    const navItems = [
        { id: 'dashboard', label: 'Dasbor Utama', icon: LayoutDashboard, roles: ['User', 'Admin', 'SuperAdmin'] },
        { id: 'tracking', label: 'Tracking Permohonan', icon: ListOrdered, roles: ['User', 'Admin', 'SuperAdmin', 'PIC'] },
        { id: 'analytics', label: 'Dasbor Analitik', icon: BarChart3, roles: ['Admin', 'SuperAdmin'] },
        { id: 'settings', label: 'Kelola Layanan', icon: Settings, roles: ['Admin', 'SuperAdmin'] },
        { id: 'users', label: 'Kelola Pengguna', icon: Users, roles: ['SuperAdmin'] },
    ];

    const picServiceLabels = {
        D: 'PIC Desain',
        P: 'PIC Publikasi',
        S: 'PIC Alat Promosi',
        M: 'PIC Multimedia',
        L: 'PIC Liputan',
    };

    const roleLabel = role === 'PIC' && picCode
        ? picServiceLabels[picCode] || 'PIC'
        : role === 'SuperAdmin' ? 'Super Admin' : role;

    const roleBadgeColor = {
        User: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        SuperAdmin: 'bg-violet-50 text-violet-700 border-violet-200',
        PIC: 'bg-green-50 text-green-700 border-green-200',
    }[role] || 'bg-slate-100 text-slate-700';

    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
                        <img
                            src="/images/logo-yarsi.png"
                            alt="Logo YARSI"
                            className="w-10 h-10 object-contain"
                        />
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-900 tracking-tight text-lg">SLM YARSI</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium hidden sm:block">Sistem Layanan Marketing</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navItems
                            .filter(item => item.roles.includes(role))
                            .map(item => {
                                const Icon = item.icon;
                                const isActive = currentTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentTab(item.id)}
                                        className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                                            isActive
                                                ? 'bg-green-600 text-white shadow-sm shadow-green-200'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                    </nav>

                    {/* Right Tools: Notif Bell, User Info */}
                    <div className="flex items-center space-x-3">
                        {/* In-App Notifications (Hanya jika user login) */}
                        {user && (
                            <NotificationBell onOpenPermohonan={(id) => {
                                setCurrentTab('tracking');
                            }} />
                        )}

                        {/* User Profile Pill */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                            >
                                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadgeColor}`}>
                                        {roleLabel}
                                    </span>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
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
                    .filter(item => item.roles.includes(role))
                    .map(item => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentTab(item.id)}
                                className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold rounded-lg ${
                                    isActive ? 'text-green-600' : 'text-slate-500'
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

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ListOrdered,
    CheckSquare,
    BarChart3,
    Settings,
    ChevronLeft,
    X,
    Users,
    Package,
    Camera,
    FileText,
    LogIn,
    CalendarClock
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, mobileOpen, setMobileOpen }) {
    const { user } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const role = user?.role || 'Guest';
    const fallbackPicMap = { ahmad: 'D', nurhaliza: 'P', bagas: 'S', dewi: 'M', rizky: 'L' };
    const picCode = user?.pic_service_code || fallbackPicMap[user?.username?.toLowerCase()] || null;

    const handleLogoClick = () => {
        if (role === 'PIC') {
            setCurrentTab('tracking');
        } else {
            setCurrentTab('dashboard');
        }
    };

    // Define navigation based on role
    const navItems = [];

    if (['User', 'Admin', 'SuperAdmin', 'Guest'].includes(role)) {
        navItems.push({ id: 'dashboard', label: 'Dasbor Utama', icon: LayoutDashboard });
    }
    if (['User', 'Admin', 'SuperAdmin', 'PIC', 'Guest'].includes(role)) {
        navItems.push({ id: 'tracking', label: role === 'PIC' ? 'Daftar Permohonan' : 'Tracking Permohonan', icon: ListOrdered });
    }
    // Ketersediaan Slot Jam (Penjadwalan & Peminjaman Ruangan/Alat) untuk User, SuperAdmin, Admin
    if (['User', 'Admin', 'SuperAdmin'].includes(role)) {
        navItems.push({ id: 'schedule-slots', label: 'Ketersediaan Slot Jam', icon: CalendarClock });
    }
    if (['Admin', 'SuperAdmin'].includes(role)) {
        navItems.push({ id: 'analytics', label: 'Dasbor Analitik', icon: BarChart3 });
        navItems.push({ id: 'stock', label: 'Manajemen Stok', icon: Package });
        navItems.push({ id: 'inventory-multimedia', label: 'Inventaris Alat', icon: Camera });
        navItems.push({ id: 'settings', label: 'Kelola Layanan', icon: Settings });
    }
    if (role === 'SuperAdmin') {
        navItems.push({ id: 'approvals', label: 'Antrean Approval', icon: CheckSquare });
        navItems.push({ id: 'users', label: 'Kelola Pengguna', icon: Users });
    }

    // PIC-specific sidebar items
    if (role === 'PIC') {
        if (picCode === 'S') {
            navItems.push({ id: 'stock', label: 'Manajemen Stok', icon: Package });
        }
        if (picCode === 'M') {
            navItems.push({ id: 'schedule-slots', label: 'Ketersediaan Slot Jam', icon: CalendarClock });
            navItems.push({ id: 'inventory-multimedia', label: 'Inventaris Alat', icon: Camera });
        }
    }

    // Menu login untuk pengunjung yang belum login (Guest)
    if (!user) {
        navItems.push({ id: 'login', label: 'Masuk / Login', icon: LogIn });
    }

    // Remove duplicates (tracking might appear twice for PIC)
    const uniqueNavItems = navItems.filter((item, idx, arr) => arr.findIndex(i => i.id === item.id) === idx);


    const sidebarContent = (isMobile = false) => (
        <div className={`flex flex-col h-full bg-white border-r border-slate-200 relative ${collapsed && !isMobile ? 'w-[72px]' : 'w-[260px]'} transition-all duration-300`}>
            {/* Collapse toggle button */}
            {!isMobile && (
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors z-50 shadow-sm"
                    title={collapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
                >
                    <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            )}

            {/* Brand Header */}
            <div className={`border-b border-slate-100 ${collapsed && !isMobile ? 'p-4 flex justify-center' : 'p-4'}`}>
                <div className="flex items-center justify-between w-full">
                    <div
                        className="flex items-center space-x-3 cursor-pointer group"
                        onClick={handleLogoClick}
                        title={role === 'PIC' ? 'Kembali ke Daftar Permohonan' : 'Kembali ke Dasbor Utama'}
                    >
                        <img
                            src="/images/logo-yarsi.png"
                            alt="Logo YARSI"
                            className="w-10 h-10 object-contain shrink-0 group-hover:scale-105 transition-transform"
                        />
                        {(!collapsed || isMobile) && (
                            <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 text-sm leading-tight truncate">SLM YARSI</p>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight truncate">Sistem Layanan Marketing</p>
                            </div>
                        )}
                    </div>
                    {isMobile && (
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>


            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                {(!collapsed || isMobile) && (
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Menu Utama</p>
                )}
                {uniqueNavItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    const isLogin = item.id === 'login';
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setCurrentTab(item.id);
                                if (isMobile) setMobileOpen(false);
                            }}
                            title={collapsed && !isMobile ? item.label : undefined}
                            className={`w-full flex items-center ${collapsed && !isMobile ? 'justify-center' : ''} space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-green-600 text-white shadow-sm shadow-green-200 font-bold'
                                    : isLogin
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-bold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Icon className="w-[18px] h-[18px] shrink-0" />
                            {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom version badge */}
            {(!collapsed || isMobile) && (
                <div className="p-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 text-center font-medium">SLM YARSI v2.0</p>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile overlay sidebar */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="relative h-full w-[260px]">
                        {sidebarContent(true)}
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden md:block h-screen sticky top-0 shrink-0">
                {sidebarContent(false)}
            </div>
        </>
    );
}

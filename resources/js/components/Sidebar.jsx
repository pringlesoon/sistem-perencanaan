import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ListOrdered,
    CheckSquare,
    BarChart3,
    Settings,
    ChevronLeft,
    Menu,
    X
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, mobileOpen, setMobileOpen }) {
    const { user } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    if (!user) return null;

    const navItems = [
        { id: 'dashboard', label: 'Dasbor Utama', icon: LayoutDashboard, roles: ['User', 'Admin', 'Approver', 'Verificator'] },
        { id: 'tracking', label: 'Tracking Permohonan', icon: ListOrdered, roles: ['User', 'Admin', 'Approver', 'Verificator'] },
        { id: 'approvals', label: 'Antrean Approval', icon: CheckSquare, roles: ['Approver', 'Admin', 'Verificator'] },
        { id: 'analytics', label: 'Dasbor Analitik', icon: BarChart3, roles: ['Admin', 'Approver'] },
        { id: 'settings', label: 'Kelola Layanan', icon: Settings, roles: ['Admin'] },
    ];

    const sidebarContent = (isMobile = false) => (
        <div className={`flex flex-col h-full bg-white border-r border-slate-200 relative ${collapsed && !isMobile ? 'w-[72px]' : 'w-[260px]'} transition-all duration-300`}>
            {/* Collapse toggle button — centered vertically */}
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
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
                        <img
                            src="/images/logo-yarsi.png"
                            alt="Logo YARSI"
                            className="w-10 h-10 object-contain shrink-0"
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
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {(!collapsed || isMobile) && (
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Menu Utama</p>
                )}
                {navItems
                    .filter(item => item.roles.includes(user.role))
                    .map(item => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentTab(item.id);
                                    if (isMobile) setMobileOpen(false);
                                }}
                                title={collapsed && !isMobile ? item.label : undefined}
                                className={`w-full flex items-center ${collapsed && !isMobile ? 'justify-center' : ''} space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-green-600 text-white shadow-sm shadow-green-200'
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
                    <p className="text-[10px] text-slate-400 text-center font-medium">SLM YARSI v1.0</p>
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



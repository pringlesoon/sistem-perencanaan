import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export default function NotificationBell({ onOpenPermohonan, placement = 'sidebar' }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const popoverRef = useRef(null);

    const fetchNotifications = async () => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        try {
            const res = await api.get('/notifications');
            if (res.data?.status === 'success') {
                setNotifications(res.data.data.notifications || []);
                setUnreadCount(res.data.data.unread_count || 0);
            }
        } catch (e) {
            // silent fail
        }
    };

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setIsOpen(false);
            return;
        }

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 20000);
        return () => clearInterval(interval);
    }, [user]);

    // Close on click outside and escape key
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const markAsRead = async (id, permohonanId) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (permohonanId && onOpenPermohonan) {
                setIsOpen(false);
                onOpenPermohonan(permohonanId);
            }
        } catch (e) {
            // ignore
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) {
            // ignore
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
            case 'danger':
                return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
            default:
                return <Info className="w-4 h-4 text-sky-500 shrink-0" />;
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-xl text-slate-600 hover:text-slate-900 transition-colors border ${
                    isOpen ? 'bg-slate-100 border-slate-300' : 'hover:bg-slate-100 border-slate-200'
                }`}
                title="Notifikasi"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className={`bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 transition-all ${
                        placement === 'navbar'
                            ? 'absolute right-0 mt-2 w-80 sm:w-96'
                            : 'fixed left-4 right-4 bottom-24 md:absolute md:inset-auto md:left-full md:ml-4 md:bottom-0 md:w-80 lg:w-96'
                    }`}
                >
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-sm">Notifikasi</span>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
                                    {unreadCount} baru
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                                    title="Tandai semua dibaca"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Tandai Dibaca</span>
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Tutup"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                Belum ada notifikasi
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => markAsRead(n.id, n.permohonan_id)}
                                    className={`px-4 py-3 flex space-x-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                                        !n.is_read ? 'bg-indigo-50/40' : ''
                                    }`}
                                >
                                    {getTypeIcon(n.type)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 leading-tight truncate">{n.title}</p>
                                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {!n.is_read && (
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 self-center"></span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

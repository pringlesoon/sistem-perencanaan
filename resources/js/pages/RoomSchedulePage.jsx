import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';
import api from '../services/api';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Search,
    Filter,
    Plus,
    CheckCircle2,
    Clock3,
    AlertCircle,
    User,
    Phone,
    Building2,
    Video,
    RefreshCw,
    X,
    CalendarDays,
    List,
    Layers,
    ExternalLink,
    Radio,
    Mic,
    Camera
} from 'lucide-react';

const HOURS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const STATUS_THEMES = {
    'Selesai': {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        dot: 'bg-emerald-500',
        chipBg: 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    'Diproses': {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        dot: 'bg-blue-500',
        chipBg: 'bg-blue-100/90 text-blue-900 border-blue-300',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    'Diajukan': {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        dot: 'bg-amber-500',
        chipBg: 'bg-amber-100/90 text-amber-900 border-amber-300',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    'Direvisi': {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        dot: 'bg-orange-500',
        chipBg: 'bg-orange-100/90 text-orange-900 border-orange-300',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
    }
};

const DEFAULT_ROOMS = [
    'Studio Podcast 1 (Lantai 2)',
    'Studio Podcast 2 (Lantai 3)',
    'Auditorium Ar-Rahman (Lantai 12)',
    'Ruang Rapat Senat (Lantai 1)',
    'Ruang Mini Teater'
];

const NEED_OPTIONS = [
    { value: 'all', label: 'Semua Kebutuhan', icon: Layers },
    { value: 'Podcast', label: 'Podcast', icon: Mic },
    { value: 'Operator Live Streaming', label: 'Live Streaming', icon: Radio },
    { value: 'Foto Dokumentasi', label: 'Foto Dokumentasi', icon: Camera },
    { value: 'Video Dokumentasi', label: 'Video Dokumentasi', icon: Video },
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'Semua Status (Terkunci)', colorDot: 'bg-indigo-500' },
    { value: 'Diproses', label: 'Diproses (Terkunci)', colorDot: 'bg-blue-500' },
    { value: 'Selesai', label: 'Selesai (Terkonfirmasi)', colorDot: 'bg-emerald-500' },
];

function formatTime(val) {
    if (!val) return '--:--';
    return String(val).slice(0, 5);
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function waLink(phone) {
    if (!phone) return '#';
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return `https://wa.me/${clean}`;
}

export default function RoomSchedulePage({ onNavigateToRequest, onOpenTrackingDetail }) {
    const { user } = useAuth();

    // Current viewing date
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day' | 'agenda'

    // Data states
    const [schedules, setSchedules] = useState([]);
    const [locations, setLocations] = useState(DEFAULT_ROOMS);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedNeed, setSelectedNeed] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal Details & Slot Selection
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);

    // Load schedules from backend
    const loadSchedules = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedNeed !== 'all') params.append('need', selectedNeed);
            if (selectedStatus !== 'all') params.append('status', selectedStatus);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());

            const res = await api.get(`/multimedia/schedule?${params.toString()}`);
            if (res.data?.status === 'success') {
                setSchedules(res.data.data.schedules || []);
                if (res.data.data.locations && res.data.data.locations.length > 0) {
                    const merged = Array.from(new Set([...DEFAULT_ROOMS, ...res.data.data.locations]));
                    setLocations(merged);
                }
            }
        } catch (err) {
            console.error('Error fetching multimedia schedules:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, [selectedNeed, selectedStatus, searchQuery]);

    // Navigation functions
    const goToToday = () => setCurrentDate(new Date());

    const handlePrev = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') {
            d.setMonth(d.getMonth() - 1);
        } else if (viewMode === 'week') {
            d.setDate(d.getDate() - 7);
        } else {
            d.setDate(d.getDate() - 1);
        }
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') {
            d.setMonth(d.getMonth() + 1);
        } else if (viewMode === 'week') {
            d.setDate(d.getDate() + 7);
        } else {
            d.setDate(d.getDate() + 1);
        }
        setCurrentDate(d);
    };

    // Date formatting helpers
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const monthTitle = currentDate.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
    });

    const isToday = (d) => {
        const today = new Date();
        return (
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
        );
    };

    // Calculate dates for Month View
    const monthCalendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Adjust for Monday start (0=Mon, 6=Sun)
        let startingDay = firstDayOfMonth.getDay() - 1;
        if (startingDay === -1) startingDay = 6;

        const days = [];

        // Previous month filler days
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
            days.push({
                date,
                isCurrentMonth: false,
                dateString: date.toISOString().split('T')[0]
            });
        }

        // Current month days
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const date = new Date(currentYear, currentMonth, i);
            days.push({
                date,
                isCurrentMonth: true,
                dateString: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            });
        }

        // Next month filler days to complete grid (42 cells = 6 rows)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(currentYear, currentMonth + 1, i);
            days.push({
                date,
                isCurrentMonth: false,
                dateString: date.toISOString().split('T')[0]
            });
        }

        return days;
    }, [currentYear, currentMonth]);

    // Calculate dates for Week View
    const weekDays = useMemo(() => {
        const d = new Date(currentDate);
        let dayOfWeek = d.getDay() - 1;
        if (dayOfWeek === -1) dayOfWeek = 6; // Monday = 0
        const monday = new Date(d);
        monday.setDate(d.getDate() - dayOfWeek);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const dayNum = String(date.getDate()).padStart(2, '0');
            days.push({
                date,
                dateString: `${y}-${m}-${dayNum}`,
                dayName: date.toLocaleDateString('id-ID', { weekday: 'short' }),
                dayNumber: date.getDate()
            });
        }
        return days;
    }, [currentDate]);

    // Filter schedules locally for instant search and instant filter reaction
    const filteredSchedules = useMemo(() => {
        return schedules.filter(item => {
            // Filter status
            if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

            // Filter jenis kebutuhan
            if (selectedNeed !== 'all') {
                const needs = Array.isArray(item.jenis_kebutuhan) ? item.jenis_kebutuhan : [item.jenis_kebutuhan];
                const matchNeed = needs.some(n => String(n).toLowerCase().includes(selectedNeed.toLowerCase()))
                    || String(item.judul_permohonan || '').toLowerCase().includes(selectedNeed.toLowerCase());
                if (!matchNeed) return false;
            }

            // Search query (instant client-side filtering)
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchSearch =
                    String(item.nomor_tiket || '').toLowerCase().includes(q) ||
                    String(item.judul_permohonan || '').toLowerCase().includes(q) ||
                    String(item.nama_kegiatan || '').toLowerCase().includes(q) ||
                    String(item.nama_pemohon || '').toLowerCase().includes(q) ||
                    String(item.unit_pemohon || '').toLowerCase().includes(q) ||
                    String(item.lokasi_alat || '').toLowerCase().includes(q);
                if (!matchSearch) return false;
            }

            return true;
        });
    }, [schedules, selectedStatus, selectedNeed, searchQuery]);

    // Group schedules by date
    const schedulesByDate = useMemo(() => {
        const map = {};
        filteredSchedules.forEach(item => {
            if (!item.tanggal_pelaksanaan) return;
            const ds = item.tanggal_pelaksanaan;
            if (!map[ds]) map[ds] = [];
            map[ds].push(item);
        });
        // Sort each day by jam_mulai
        Object.keys(map).forEach(key => {
            map[key].sort((a, b) => timeToMinutes(a.jam_mulai) - timeToMinutes(b.jam_mulai));
        });
        return map;
    }, [filteredSchedules]);

    // Today's summary metrics
    const todayStr = useMemo(() => {
        const t = new Date();
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    }, []);

    const todaySchedules = schedulesByDate[todayStr] || [];

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 h-full flex flex-col">
            {/* Header Title & Quick Metrics */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Ketersediaan Slot Jam
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Penjadwalan & Peminjaman Ruangan, Studio Podcast, dan Fasilitas Multimedia Universitas YARSI.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Action: Booking Shortcut for User */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {['User', 'Admin', 'SuperAdmin'].includes(user?.role) && onNavigateToRequest && (
                        <button
                            type="button"
                            onClick={() => onNavigateToRequest('M')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Ajukan Peminjaman Ruangan / Alat</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={loadSchedules}
                        className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
                        title="Muat ulang jadwal"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jadwal Hari Ini</span>
                        <p className="text-lg font-black text-slate-900">{todaySchedules.length} Kegiatan</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reservasi Terjadwal</span>
                        <p className="text-lg font-black text-slate-900">{schedules.length} Pemesanan</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Video className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Google Calendar Control Bar (Date Nav, Views, Filters) */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                {/* Left: Navigation Buttons (Today, <, >, Month Title) */}
                <div className="flex items-center space-x-2.5">
                    <button
                        type="button"
                        onClick={goToToday}
                        className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                        Hari Ini
                    </button>

                    <div className="flex items-center space-x-1">
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Sebelumnya"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Selanjutnya"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight min-w-[150px]">
                        {monthTitle}
                    </h3>
                </div>

                {/* Center / Right: Filters & View Switcher */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Instant Search Bar */}
                    <div className="relative w-full sm:w-56">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kegiatan, lokasi, PIC..."
                            className="w-full pl-8 pr-7 py-2 text-xs bg-white hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 rounded-xl font-medium text-slate-700 placeholder-slate-400 transition-all outline-none shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                                title="Hapus pencarian"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Filter Jenis Kebutuhan (CustomSelect) */}
                    <div className="w-full sm:w-48">
                        <CustomSelect
                            value={selectedNeed}
                            onChange={(val) => setSelectedNeed(val)}
                            options={NEED_OPTIONS}
                            placeholder="Semua Kebutuhan"
                            icon={Layers}
                            fullWidth
                        />
                    </div>

                    {/* Filter Status (CustomSelect) */}
                    <div className="w-full sm:w-44">
                        <CustomSelect
                            value={selectedStatus}
                            onChange={(val) => setSelectedStatus(val)}
                            options={STATUS_OPTIONS}
                            placeholder="Semua Status"
                            fullWidth
                        />
                    </div>

                    {/* View Switcher (Google Calendar Tabs) */}
                    <div className="flex items-center bg-slate-100/90 rounded-xl p-1 shadow-2xs border border-slate-200/60 shrink-0">
                        <button
                            type="button"
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Bulan
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Minggu
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Hari
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('agenda')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Agenda
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-4 px-2 text-xs font-medium text-slate-500">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Indikator Slot:</span>
                <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Selesai / Terkonfirmasi</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Diproses / Slot Terkunci</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300"></span>
                    <span>Slot Kosong (Tersedia)</span>
                </div>
            </div>

            {/* Main Calendar Viewport */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[580px]">
                {loading && (
                    <div className="w-full bg-indigo-50 border-b border-indigo-100 py-1.5 px-4 text-center text-xs font-bold text-indigo-700 flex items-center justify-center gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Memperbarui data ketersediaan jadwal...</span>
                    </div>
                )}

                {/* 1. MONTH VIEW */}
                {viewMode === 'month' && (
                    <div className="flex-1 flex flex-col overflow-auto">
                        {/* Day of Week Headers */}
                        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-2 text-xs font-bold text-slate-600 select-none">
                            <span>Sen</span>
                            <span>Sel</span>
                            <span>Rab</span>
                            <span>Kam</span>
                            <span>Jum</span>
                            <span className="text-indigo-600">Sab</span>
                            <span className="text-rose-600">Min</span>
                        </div>

                        {/* Calendar Grid (6 rows x 7 cols) */}
                        <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-slate-100">
                            {monthCalendarDays.map((item, idx) => {
                                const daySchedules = schedulesByDate[item.dateString] || [];
                                const isCurrentDateToday = isToday(item.date);

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            if (daySchedules.length > 0) {
                                                // Beralih ke day view untuk melihat slot detail
                                                setCurrentDate(item.date);
                                                setViewMode('day');
                                            } else {
                                                setSelectedSlotInfo({
                                                    date: item.dateString,
                                                    formattedDate: item.date.toLocaleDateString('id-ID', { dateStyle: 'full' }),
                                                    isFree: true
                                                });
                                            }
                                        }}
                                        className={`p-1.5 min-h-[95px] flex flex-col justify-between transition-colors hover:bg-slate-50/80 cursor-pointer ${
                                            !item.isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white text-slate-800'
                                        }`}
                                    >
                                        {/* Date number */}
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-transform ${
                                                    isCurrentDateToday
                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                        : item.isCurrentMonth
                                                        ? 'text-slate-800'
                                                        : 'text-slate-400'
                                                }`}
                                            >
                                                {item.date.getDate()}
                                            </span>

                                            {daySchedules.length > 0 && (
                                                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-full">
                                                    {daySchedules.length}
                                                </span>
                                            )}
                                        </div>

                                        {/* Event chips */}
                                        <div className="flex-1 space-y-1 overflow-hidden">
                                            {daySchedules.slice(0, 3).map((event) => {
                                                const theme = STATUS_THEMES[event.status] || STATUS_THEMES['Diproses'];
                                                return (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedEvent(event);
                                                        }}
                                                        className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold truncate transition-transform hover:scale-[1.02] cursor-pointer shadow-2xs ${theme.chipBg}`}
                                                        title={`${event.jam_mulai} - ${event.jam_selesai} | ${event.nama_kegiatan} (${event.lokasi_alat})`}
                                                    >
                                                        <span className="font-mono text-[9px] mr-1 opacity-90">{formatTime(event.jam_mulai)}</span>
                                                        <span className="truncate">{event.nama_kegiatan || event.judul_permohonan}</span>
                                                    </div>
                                                );
                                            })}

                                            {daySchedules.length > 3 && (
                                                <div className="text-[10px] text-slate-400 font-bold px-1">
                                                    +{daySchedules.length - 3} lainnya
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 2. WEEK VIEW */}
                {viewMode === 'week' && (
                    <div className="flex-1 flex flex-col overflow-auto">
                        {/* Week Header */}
                        <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-bold text-slate-600 sticky top-0 z-20">
                            <div className="text-slate-400 font-normal">Waktu</div>
                            {weekDays.map((wd, idx) => {
                                const isCurrent = isToday(wd.date);
                                return (
                                    <div key={idx} className="flex flex-col items-center">
                                        <span className="text-[11px] text-slate-500 uppercase">{wd.dayName}</span>
                                        <span
                                            className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm mt-0.5 ${
                                                isCurrent ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-800'
                                            }`}
                                        >
                                            {wd.dayNumber}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Week Time Grid */}
                        <div className="grid grid-cols-8 divide-x divide-slate-100 flex-1 relative min-w-[700px]">
                            {/* Time axis */}
                            <div className="divide-y divide-slate-100 bg-slate-50/50 text-[11px] text-slate-400 font-medium text-right pr-2 select-none">
                                {HOURS.map((hour) => (
                                    <div key={hour} className="h-16 flex items-start justify-end pt-1">
                                        <span>{hour}</span>
                                    </div>
                                ))}
                            </div>

                            {/* 7 Day Columns */}
                            {weekDays.map((wd) => {
                                const dayEvents = schedulesByDate[wd.dateString] || [];
                                return (
                                    <div
                                        key={wd.dateString}
                                        className="relative divide-y divide-slate-100 min-h-full hover:bg-slate-50/20"
                                    >
                                        {/* Background hour grid lines */}
                                        {HOURS.map((hour) => (
                                            <div
                                                key={hour}
                                                onClick={() => {
                                                    setSelectedSlotInfo({
                                                        date: wd.dateString,
                                                        time: hour,
                                                        formattedDate: wd.date.toLocaleDateString('id-ID', { dateStyle: 'full' }),
                                                        isFree: true
                                                    });
                                                }}
                                                className="h-16 border-t border-slate-100 cursor-pointer hover:bg-indigo-50/20 transition-colors"
                                                title={`Klik untuk mengecek slot ${hour} pada ${wd.dayName}, ${wd.dayNumber}`}
                                            />
                                        ))}

                                        {/* Absolute overlay event blocks */}
                                        {dayEvents.map((event) => {
                                            const startMin = timeToMinutes(event.jam_mulai);
                                            const endMin = timeToMinutes(event.jam_selesai) || (startMin + 60);
                                            const dayStartMin = 7 * 60; // 07:00 is minute 0
                                            const totalDayMinutes = 11 * 60; // 07:00 to 18:00 = 660 mins

                                            const topOffset = Math.max(0, ((startMin - dayStartMin) / totalDayMinutes) * 100);
                                            const heightPercent = Math.min(100 - topOffset, ((endMin - startMin) / totalDayMinutes) * 100);

                                            const theme = STATUS_THEMES[event.status] || STATUS_THEMES['Diproses'];

                                            return (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedEvent(event);
                                                    }}
                                                    style={{
                                                        top: `${topOffset}%`,
                                                        height: `${Math.max(heightPercent, 5)}%`,
                                                    }}
                                                    className={`absolute left-1 right-1 rounded-xl p-1.5 border shadow-xs overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] z-10 ${theme.bg} ${theme.border}`}
                                                >
                                                    <div className="flex items-center justify-between text-[10px] font-black text-slate-700 leading-tight">
                                                        <span className="font-mono">{formatTime(event.jam_mulai)} - {formatTime(event.jam_selesai)}</span>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
                                                    </div>
                                                    <div className="text-[11px] font-bold text-slate-900 truncate mt-0.5">
                                                        {event.nama_kegiatan}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                                                        <span className="truncate">{event.lokasi_alat}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. DAY VIEW */}
                {viewMode === 'day' && (
                    <div className="flex-1 flex flex-col overflow-auto">
                        {/* Day Header Banner */}
                        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-black text-slate-900">
                                    {currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </h4>
                                <p className="text-xs text-slate-500">
                                    Jadwal operasional ketersediaan ruangan & alat (Pukul 07:00 - 18:00 WIB)
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-2xs">
                                    {(schedulesByDate[currentDate.toISOString().split('T')[0]] || []).length} Kegiatan Terjadwal
                                </span>
                            </div>
                        </div>

                        {/* Day Slot Hour Grid */}
                        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                            {HOURS.map((hour) => {
                                const dateStr = currentDate.toISOString().split('T')[0];
                                const currentDayEvents = schedulesByDate[dateStr] || [];

                                // Find events active during this hour
                                const hourMin = timeToMinutes(hour);
                                const nextHourMin = hourMin + 60;
                                const matchingEvents = currentDayEvents.filter(ev => {
                                    const s = timeToMinutes(ev.jam_mulai);
                                    const e = timeToMinutes(ev.jam_selesai);
                                    return s < nextHourMin && e > hourMin;
                                });

                                const isOccupied = matchingEvents.length > 0;

                                return (
                                    <div
                                        key={hour}
                                        className={`flex items-start min-h-[72px] p-3 transition-colors ${
                                            isOccupied ? 'bg-slate-50/50' : 'hover:bg-slate-50/70'
                                        }`}
                                    >
                                        {/* Hour Label */}
                                        <div className="w-20 shrink-0 font-mono font-bold text-xs text-slate-500 pt-1">
                                            {hour} WIB
                                        </div>

                                        {/* Content in this hour */}
                                        <div className="flex-1">
                                            {isOccupied ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {matchingEvents.map(ev => {
                                                        const theme = STATUS_THEMES[ev.status] || STATUS_THEMES['Diproses'];
                                                        return (
                                                            <div
                                                                key={ev.id}
                                                                onClick={() => setSelectedEvent(ev)}
                                                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:shadow-xs ${theme.bg} ${theme.border}`}
                                                            >
                                                                <div className="min-w-0 pr-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-xs font-black text-indigo-700">
                                                                            {formatTime(ev.jam_mulai)} - {formatTime(ev.jam_selesai)}
                                                                        </span>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                                                                            {ev.status}
                                                                        </span>
                                                                    </div>
                                                                    <h5 className="text-xs font-bold text-slate-900 truncate mt-1">
                                                                        {ev.nama_kegiatan}
                                                                    </h5>
                                                                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                                        <MapPin className="w-3 h-3 text-slate-400" />
                                                                        <span>{ev.lokasi_alat}</span>
                                                                        <span className="mx-1">•</span>
                                                                        <span>{ev.nama_pemohon} ({ev.unit_pemohon})</span>
                                                                    </p>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs"
                                                                >
                                                                    Detail
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => {
                                                        setSelectedSlotInfo({
                                                            date: dateStr,
                                                            time: hour,
                                                            formattedDate: currentDate.toLocaleDateString('id-ID', { dateStyle: 'full' }),
                                                            isFree: true
                                                        });
                                                    }}
                                                    className="flex items-center justify-between py-2 px-3 border border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center space-x-2 text-xs font-semibold">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <span>Slot Tersedia & Kosong (Pukul {hour} WIB)</span>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Klik untuk booking / cek slot →
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 4. AGENDA VIEW */}
                {viewMode === 'agenda' && (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                        {filteredSchedules.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <h4 className="text-sm font-bold text-slate-700">Tidak ada jadwal peminjaman</h4>
                                <p className="text-xs text-slate-400 mt-1">Belum ada permohonan peminjaman ruangan yang cocok dengan filter aktif.</p>
                            </div>
                        ) : (
                            Object.keys(schedulesByDate)
                                .sort()
                                .map((dateStr) => {
                                    const items = schedulesByDate[dateStr];
                                    const parsedDate = new Date(dateStr);
                                    const isCurrent = isToday(parsedDate);

                                    return (
                                        <div key={dateStr} className="space-y-2.5">
                                            {/* Date Banner */}
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-2 ${
                                                        isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    <CalendarIcon className="w-3.5 h-3.5" />
                                                    <span>{parsedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                    {isCurrent && <span className="text-[9px] bg-white text-indigo-700 px-1.5 py-0.2 rounded-md">Hari Ini</span>}
                                                </div>
                                                <div className="flex-1 h-px bg-slate-200"></div>
                                                <span className="text-xs font-bold text-slate-400">{items.length} Sesi Peminjaman</span>
                                            </div>

                                            {/* List cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {items.map((event) => {
                                                    const theme = STATUS_THEMES[event.status] || STATUS_THEMES['Diproses'];
                                                    return (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => setSelectedEvent(event)}
                                                            className={`p-4 rounded-2xl border transition-all hover:shadow-sm cursor-pointer ${theme.bg} ${theme.border}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                                                                            {event.nomor_tiket}
                                                                        </span>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                                                                            {event.status}
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-2">
                                                                        {event.nama_kegiatan}
                                                                    </h4>
                                                                </div>

                                                                <div className="text-right shrink-0">
                                                                    <span className="font-mono font-black text-xs text-slate-800 block">
                                                                        {formatTime(event.jam_mulai)} - {formatTime(event.jam_selesai)}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400">
                                                                        {event.durasi_menit ? `${event.durasi_menit} menit` : 'Durasi sesi'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    <span className="truncate font-semibold">{event.lokasi_alat}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    <span className="truncate">{event.nama_pemohon}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                )}
            </div>

            {/* EVENT DETAIL MODAL (Ketika klik blok acara pada Google Calendar) */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-black text-indigo-700 bg-white px-2.5 py-1 rounded-xl border border-indigo-100 shadow-2xs">
                                    {selectedEvent.nomor_tiket}
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_THEMES[selectedEvent.status]?.badge || 'bg-slate-100 text-slate-700'}`}>
                                    {selectedEvent.status}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body Details */}
                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div>
                                <h3 className="text-base font-black text-slate-900 leading-snug">
                                    {selectedEvent.nama_kegiatan || selectedEvent.judul_permohonan}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Peminjaman Fasilitas & Alat Multimedia Universitas YARSI
                                </p>
                            </div>

                            {/* Time & Room Highlight Box */}
                            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2.5">
                                <div className="flex items-center gap-3 text-xs">
                                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div>
                                        <span className="font-bold text-slate-800">
                                            {new Date(selectedEvent.tanggal_pelaksanaan).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                                        </span>
                                        <span className="block font-mono text-indigo-700 font-black text-sm mt-0.5">
                                            {formatTime(selectedEvent.jam_mulai)} - {formatTime(selectedEvent.jam_selesai)} WIB
                                            {selectedEvent.durasi_menit ? ` (${selectedEvent.durasi_menit} menit)` : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs pt-2 border-t border-indigo-100/70">
                                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Ruangan / Lokasi</span>
                                        <span className="font-extrabold text-slate-900 text-xs">
                                            {selectedEvent.lokasi_alat}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Identity Box */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identitas Pemohon</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block font-bold">Nama Lengkap</span>
                                        <span className="font-bold text-slate-900">{selectedEvent.nama_pemohon}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block font-bold">Program Studi / Unit</span>
                                        <span className="font-semibold text-slate-700">{selectedEvent.unit_pemohon}</span>
                                    </div>
                                </div>

                                {selectedEvent.no_whatsapp && (
                                    <div className="pt-2 border-t border-slate-200/60">
                                        <span className="text-[10px] text-slate-400 block font-bold mb-1">Kontak WhatsApp</span>
                                        <a
                                            href={waLink(selectedEvent.no_whatsapp)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs transition-colors"
                                        >
                                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Hubungi {selectedEvent.no_whatsapp}</span>
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Kebutuhan Alat */}
                            {Array.isArray(selectedEvent.jenis_kebutuhan) && selectedEvent.jenis_kebutuhan.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kebutuhan Fasilitas & Alat</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedEvent.jenis_kebutuhan.map((item, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-2xs">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Catatan / Keterangan */}
                            {selectedEvent.catatan && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Keterangan / Catatan</span>
                                    <p className="text-slate-700 whitespace-pre-wrap">{selectedEvent.catatan}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>

                            {onOpenTrackingDetail && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const reqId = selectedEvent.permohonan_id;
                                        setSelectedEvent(null);
                                        onOpenTrackingDetail(reqId);
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                >
                                    <span>Buka di Tracking</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SLOT KOSONG / AVAILABILITY POPUP MODAL */}
            {selectedSlotInfo && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>

                        <div>
                            <h3 className="text-base font-black text-slate-900">Slot Jam Tersedia</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Pada tanggal <span className="font-bold text-slate-800">{selectedSlotInfo.formattedDate}</span>
                                {selectedSlotInfo.time ? ` pukul ${selectedSlotInfo.time} WIB` : ''}.
                            </p>
                        </div>

                        <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left leading-relaxed">
                            💡 Ruangan dan alat multimedia belum terisi atau memiliki slot kosong pada waktu ini. Anda dapat mengajukan permohonan peminjaman sekarang.
                        </p>

                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setSelectedSlotInfo(null)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>

                            {onNavigateToRequest && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSlotInfo(null);
                                        onNavigateToRequest('M');
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Ajukan Peminjaman</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

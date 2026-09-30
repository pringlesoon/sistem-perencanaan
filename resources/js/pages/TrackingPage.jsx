import React, { useState, useEffect, useRef, useCallback } from 'react';

const formatDurasi = (menitFloat) => {
    if (menitFloat == null) return '-';
    const totalDetik = Math.round(Number(menitFloat) * 60);
    const menit = Math.floor(totalDetik / 60);
    const detik = totalDetik % 60;
    if (menit === 0) return `${detik} detik`;
    if (detik === 0) return `${menit} menit`;
    return `${menit} menit ${detik} detik`;
};

import { useAuth } from '../context/AuthContext';
import StatusTimeline from '../components/StatusTimeline';
import api from '../services/api';
import {
    Search,
    Filter,
    Download,
    Eye,
    X,
    Calendar,
    Clock,
    FileText,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ExternalLink,
    RefreshCw,
    Paperclip,
    GripVertical
} from 'lucide-react';

// Kanban column definitions
const KANBAN_COLUMNS = [
    { key: 'Diajukan', label: 'Diajukan', color: 'amber', bgCard: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-amber-100', textColor: 'text-amber-800' },
    { key: 'Diproses', label: 'Diproses', color: 'blue', bgCard: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100', textColor: 'text-blue-800' },
    { key: 'Direvisi', label: 'Direvisi', color: 'orange', bgCard: 'bg-orange-50', borderColor: 'border-orange-200', headerBg: 'bg-orange-100', textColor: 'text-orange-800' },
    { key: 'Menunggu Approval Sebagian', label: 'Menunggu Approval', color: 'purple', bgCard: 'bg-purple-50', borderColor: 'border-purple-200', headerBg: 'bg-purple-100', textColor: 'text-purple-800' },
    { key: 'Selesai', label: 'Selesai', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
    { key: 'Ditolak', label: 'Ditolak', color: 'rose', bgCard: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-rose-100', textColor: 'text-rose-800' },
];

const statusBadgeStyles = {
    'Diajukan': 'bg-amber-50 text-amber-800 border-amber-200',
    'Diproses': 'bg-blue-50 text-blue-800 border-blue-200',
    'Direvisi': 'bg-orange-50 text-orange-800 border-orange-200',
    'Menunggu Approval Sebagian': 'bg-purple-50 text-purple-800 border-purple-200',
    'Selesai': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Ditolak': 'bg-rose-50 text-rose-800 border-rose-200',
};

// Kanban Card Component with drag support
function KanbanCard({ req, column, onOpenDetail, isDraggable, onDragStart, onDragEnd }) {
    return (
        <div
            draggable={isDraggable}
            onDragStart={isDraggable ? (e) => onDragStart(e, req) : undefined}
            onDragEnd={isDraggable ? onDragEnd : undefined}
            onClick={() => onOpenDetail(req.id)}
            className={`${column.bgCard} border ${column.borderColor} rounded-xl p-3.5 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
            {/* Drag handle indicator for admin */}
            {isDraggable && (
                <div className="flex items-center justify-between mb-1.5">
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                    <span className="text-[9px] text-slate-300 group-hover:text-slate-400 font-medium">geser</span>
                </div>
            )}

            {/* Ticket Number */}
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                    {req.nomor_tiket}
                </span>
                <span className="text-[10px] text-slate-400">
                    {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </span>
            </div>

            {/* Title */}
            <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 mb-2">
                {req.judul_permohonan}
            </h4>

            {/* Service Badge */}
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 mb-2">
                [{req.service?.code || '-'}] {req.kategori}
            </span>

            {/* Footer: User + Lead Time */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <div className="flex items-center space-x-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {req.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium truncate">{req.user?.name}</span>
                </div>
                {req.calculated_lead_time && (
                    <div className="flex items-center space-x-0.5 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{req.calculated_lead_time}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TrackingPage({ defaultSelectedId }) {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [serviceFilter, setServiceFilter] = useState('Semua');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Detail modal states
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Admin status update modal states
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [targetStatus, setTargetStatus] = useState('Diproses');
    const [statusNote, setStatusNote] = useState('');
    const [submittingStatus, setSubmittingStatus] = useState(false);
    const [statusError, setStatusError] = useState(null);

    // Drag-and-drop state (admin only)
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [dragUpdating, setDragUpdating] = useState(false);

    // Auto-scroll on drag
    const scrollRef = useRef(null);
    const scrollAnimRef = useRef(null);

    const isAdmin = user?.isAdmin?.() || user?.role === 'Admin';

    const loadRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('per_page', '100');
            if (serviceFilter !== 'Semua') params.append('service_code', serviceFilter);
            if (searchTerm) params.append('search', searchTerm);

            const res = await api.get(`/requests?${params.toString()}`);
            if (res.data?.status === 'success') {
                setRequests(res.data.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, [serviceFilter, searchTerm]);

    const openDetail = async (id) => {
        setLoadingDetail(true);
        try {
            const res = await api.get(`/requests/${id}`);
            if (res.data?.status === 'success') {
                setSelectedDetail(res.data.data);
            }
        } catch (err) {
            alert('Gagal memuat detail permohonan.');
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        if (defaultSelectedId) {
            openDetail(defaultSelectedId);
        }
    }, [defaultSelectedId]);

    const handleUpdateStatusSubmit = async (e) => {
        e.preventDefault();
        setStatusError(null);
        setSubmittingStatus(true);
        try {
            const res = await api.patch(`/requests/${selectedDetail.id}/status`, {
                status: targetStatus,
                catatan: statusNote,
            });

            if (res.data?.status === 'success') {
                setSelectedDetail(res.data.data);
                setUpdateModalOpen(false);
                setStatusNote('');
                loadRequests();
            }
        } catch (err) {
            setStatusError(err.response?.data?.message || 'Gagal mengubah status.');
        } finally {
            setSubmittingStatus(false);
        }
    };

    const handleApproverAction = async (decision) => {
        const note = prompt(`Masukkan catatan ${decision === 'approve' ? 'persetujuan' : 'penolakan'} kuota:`, decision === 'approve' ? 'Disetujui penuh oleh Kepala Divisi.' : 'Ditolak.');
        if (note === null) return;

        try {
            const res = await api.post(`/requests/${selectedDetail.id}/approve`, {
                decision,
                catatan: note,
            });
            if (res.data?.status === 'success') {
                setSelectedDetail(res.data.data);
                loadRequests();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memproses keputusan.');
        }
    };

    // Drag-and-drop handlers
    const handleDragStart = (e, req) => {
        setDraggedItem(req);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', req.id);
    };

    const handleDragOver = (e, columnKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnKey);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    // Auto-scroll the kanban board while dragging
    const handleBoardDragOver = useCallback((e) => {
        const container = scrollRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const ZONE = 100;   // px dari tepi yang memicu scroll
        const SPEED = 12;   // px per frame

        const distRight = rect.right - e.clientX;
        const distLeft  = e.clientX - rect.left;

        // Hentikan animasi sebelumnya
        if (scrollAnimRef.current) {
            cancelAnimationFrame(scrollAnimRef.current);
            scrollAnimRef.current = null;
        }

        if (distRight < ZONE && distRight > 0) {
            // Scroll ke kanan
            const intensity = 1 - distRight / ZONE;
            const step = () => {
                container.scrollLeft += SPEED * intensity;
                scrollAnimRef.current = requestAnimationFrame(step);
            };
            scrollAnimRef.current = requestAnimationFrame(step);
        } else if (distLeft < ZONE && distLeft > 0) {
            // Scroll ke kiri
            const intensity = 1 - distLeft / ZONE;
            const step = () => {
                container.scrollLeft -= SPEED * intensity;
                scrollAnimRef.current = requestAnimationFrame(step);
            };
            scrollAnimRef.current = requestAnimationFrame(step);
        }
    }, []);

    const handleDrop = async (e, targetColumnKey) => {
        e.preventDefault();
        setDragOverColumn(null);
        if (!draggedItem || draggedItem.status === targetColumnKey) {
            setDraggedItem(null);
            return;
        }
        setDragUpdating(true);
        try {
            const res = await api.patch(`/requests/${draggedItem.id}/status`, {
                status: targetColumnKey,
                catatan: `Status diperbarui via Kanban: ${draggedItem.status} → ${targetColumnKey}`,
            });
            if (res.data?.status === 'success') {
                setRequests(prev => prev.map(r =>
                    r.id === draggedItem.id ? { ...r, status: targetColumnKey } : r
                ));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memperbarui status.');
        } finally {
            setDraggedItem(null);
            setDragUpdating(false);
        }
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverColumn(null);
        // Hentikan auto-scroll
        if (scrollAnimRef.current) {
            cancelAnimationFrame(scrollAnimRef.current);
            scrollAnimRef.current = null;
        }
    };

    const handleExport = (format) => {
        const params = new URLSearchParams();
        if (serviceFilter !== 'Semua') params.append('service_code', serviceFilter);
        if (searchTerm) params.append('search', searchTerm);
        window.open(`/api/v1/export/${format}?${params.toString()}`, '_blank');
    };

    // Group requests into kanban columns, applying date filter
    const getFilteredGrouped = () => {
        let filtered = requests;

        // Date filter
        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            filtered = filtered.filter(r => new Date(r.created_at) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => new Date(r.created_at) <= to);
        }

        const grouped = {};
        KANBAN_COLUMNS.forEach(col => { grouped[col.key] = []; });
        filtered.forEach(req => {
            if (grouped[req.status]) {
                grouped[req.status].push(req);
            }
        });
        return grouped;
    };

    const groupedRequests = getFilteredGrouped();

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 h-full flex flex-col">
            {/* Header & Export Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Tracking Permohonan & Riwayat Status
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {user?.isUser()
                            ? 'Pantau perkembangan dan estimasi Lead Time permohonan yang Anda ajukan.'
                            : 'Manajemen antrean permohonan seluruh unit kerja internal.'}
                    </p>
                </div>

                {(user?.isAdmin() || user?.isApprover()) && (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleExport('csv')}
                            className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>CSV</span>
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Excel</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Cari No. Tiket, Judul..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none"
                    />
                </div>

                {/* Filter Layanan */}
                <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none"
                >
                    <option value="Semua">Semua Layanan</option>
                    <option value="D">[D] Desain Grafis</option>
                    <option value="P">[P] Publikasi Website & Social Media</option>
                    <option value="S">[S] Permohonan Alat Promosi</option>
                    <option value="M">[M] Multimedia, Dokumentasi & Live Streaming</option>
                    <option value="L">[L] Liputan & Berita</option>
                </select>

                {/* Date From */}
                <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none"
                        title="Dari tanggal"
                    />
                </div>

                {/* Date To */}
                <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slate-400">s/d</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none"
                        title="Sampai tanggal"
                    />
                </div>

                {/* Clear date filters */}
                {(dateFrom || dateTo) && (
                    <button
                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                        className="px-2 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors"
                    >
                        Reset Tanggal
                    </button>
                )}

                <button
                    onClick={() => loadRequests()}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Refresh data"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Kanban Board */}
            <div
                ref={scrollRef}
                onDragOver={isAdmin ? handleBoardDragOver : undefined}
                onDragLeave={() => {
                    if (scrollAnimRef.current) {
                        cancelAnimationFrame(scrollAnimRef.current);
                        scrollAnimRef.current = null;
                    }
                }}
                className="flex-1 overflow-x-auto pb-4 scroll-smooth"
            >
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center space-y-2">
                            <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-slate-500 font-medium">Memuat data permohonan...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-4 min-w-max h-full">
                        {KANBAN_COLUMNS.map(column => {
                            const items = groupedRequests[column.key] || [];
                            const isDropTarget = isAdmin && dragOverColumn === column.key && draggedItem?.status !== column.key;
                            return (
                                <div
                                    key={column.key}
                                    onDragOver={isAdmin ? (e) => handleDragOver(e, column.key) : undefined}
                                    onDragLeave={isAdmin ? handleDragLeave : undefined}
                                    onDrop={isAdmin ? (e) => handleDrop(e, column.key) : undefined}
                                    className={`w-[280px] flex-shrink-0 flex flex-col bg-slate-50/80 rounded-2xl border transition-all duration-150 ${
                                        isDropTarget
                                            ? `${column.borderColor} border-2 ring-2 ring-offset-1 ring-${column.color}-400 shadow-lg`
                                            : 'border-slate-200'
                                    }`}
                                >
                                    {/* Column Header */}
                                    <div className={`${column.headerBg} px-4 py-3 rounded-t-2xl border-b ${column.borderColor} flex items-center justify-between`}>
                                        <div className="flex items-center space-x-2">
                                            <h3 className={`text-xs font-bold ${column.textColor}`}>{column.label}</h3>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${column.bgCard} ${column.textColor} border ${column.borderColor}`}>
                                            {items.length}
                                        </span>
                                    </div>

                                    {/* Column Body — drop zone */}
                                    <div
                                        className={`flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] rounded-b-2xl transition-colors duration-150 ${
                                            isDropTarget ? `${column.bgCard} bg-opacity-60` : ''
                                        }`}
                                    >
                                        {isDropTarget && (
                                            <div className={`border-2 border-dashed ${column.borderColor} rounded-xl py-4 text-center`}>
                                                <p className={`text-[11px] font-bold ${column.textColor}`}>Lepas di sini →</p>
                                            </div>
                                        )}
                                        {items.length === 0 && !isDropTarget ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                <p className="text-[11px] font-medium">Tidak ada permohonan</p>
                                            </div>
                                        ) : (
                                            items.map(req => (
                                                <KanbanCard
                                                    key={req.id}
                                                    req={req}
                                                    column={column}
                                                    onOpenDetail={openDetail}
                                                    isDraggable={isAdmin}
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Drawer / Modal */}
            {selectedDetail && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-mono text-sm font-black text-indigo-700">{selectedDetail.nomor_tiket}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusBadgeStyles[selectedDetail.status]}`}>
                                        {selectedDetail.status}
                                    </span>
                                </div>
                                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                                    {selectedDetail.judul_permohonan}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Diajukan oleh: <strong>{selectedDetail.user?.name}</strong> ({selectedDetail.user?.unit_kerja}) pada {new Date(selectedDetail.created_at).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDetail(null)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-6">
                            {/* Deskripsi */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Deskripsi Kebutuhan</h4>
                                <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                                    {selectedDetail.deskripsi_kebutuhan}
                                </p>
                            </div>

                            {/* Detail Spesifik Multimedia [M] */}
                            {selectedDetail.multimedia_detail && (
                                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs space-y-2">
                                    <h4 className="font-bold text-emerald-900 flex items-center space-x-1.5">
                                        <Calendar className="w-4 h-4 text-emerald-600" />
                                        <span>Detail Peminjaman Multimedia</span>
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                                        <p>Tanggal: <strong>{selectedDetail.multimedia_detail.tanggal_pelaksanaan}</strong></p>
                                        <p>Waktu: <strong>{selectedDetail.multimedia_detail.jam_mulai?.slice(0, 5)} - {selectedDetail.multimedia_detail.jam_selesai?.slice(0, 5)} WIB</strong></p>
                                        <p>Durasi: <strong>{formatDurasi(selectedDetail.multimedia_detail.durasi_menit)}</strong></p>
                                        <p>Lokasi/Alat: <strong>{selectedDetail.multimedia_detail.lokasi_alat}</strong></p>
                                    </div>
                                </div>
                            )}

                            {/* Detail Spesifik Suvenir [S] */}
                            {selectedDetail.suvenir_detail && (
                                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs space-y-3">
                                    <h4 className="font-bold text-amber-900 flex items-center space-x-1.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                        <span>Breakdown Permohonan Alat Promosi</span>
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2 bg-white rounded-xl border border-amber-200">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Diminta</p>
                                            <p className="text-base font-black text-slate-900">{selectedDetail.suvenir_detail.qty_diminta} unit</p>
                                        </div>
                                        <div className="p-2 bg-white rounded-xl border border-emerald-200">
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase">Auto-Approve</p>
                                            <p className="text-base font-black text-emerald-700">{selectedDetail.suvenir_detail.qty_disetujui_otomatis} unit</p>
                                        </div>
                                        <div className="p-2 bg-white rounded-xl border border-amber-300">
                                            <p className="text-[10px] text-amber-700 font-bold uppercase">Perlu Approval</p>
                                            <p className="text-base font-black text-amber-700">{selectedDetail.suvenir_detail.qty_perlu_approval} unit</p>
                                        </div>
                                    </div>

                                    {user?.isApprover() && selectedDetail.status === 'Menunggu Approval Sebagian' && (
                                        <div className="pt-2 border-t border-amber-200 flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handleApproverAction('reject')}
                                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs"
                                            >
                                                Tolak Sisa Kuota ({selectedDetail.suvenir_detail.qty_perlu_approval})
                                            </button>
                                            <button
                                                onClick={() => handleApproverAction('approve')}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs"
                                            >
                                                Setujui Sisa Kuota ({selectedDetail.suvenir_detail.qty_perlu_approval})
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lampiran */}
                            {selectedDetail.attachments && selectedDetail.attachments.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lampiran Berkas</h4>
                                    <div className="space-y-1.5">
                                        {selectedDetail.attachments.map(att => (
                                            <a
                                                key={att.id}
                                                href={`/storage/${att.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl text-xs text-indigo-700 font-medium transition-colors"
                                            >
                                                <div className="flex items-center space-x-2 truncate">
                                                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{att.file_name}</span>
                                                    <span className="text-[10px] text-slate-400">({(att.file_size / 1024).toFixed(0)} KB)</span>
                                                </div>
                                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status Timeline */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    Riwayat Status Kronologis
                                </h4>
                                <StatusTimeline histories={selectedDetail.status_histories} />
                            </div>

                            {/* Admin Status Update Button */}
                            {user?.isAdmin() && (
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Aksi Khusus Admin:</span>
                                    <button
                                        onClick={() => setUpdateModalOpen(true)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs"
                                    >
                                        Ubah Status / Beri Revisi
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Ubah Status Admin */}
            {updateModalOpen && (
                <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <h4 className="font-bold text-slate-900 text-sm">Perbarui Status Permohonan</h4>
                            <button onClick={() => setUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {statusError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-4">
                                {statusError}
                            </div>
                        )}

                        <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Status Baru</label>
                                <select
                                    value={targetStatus}
                                    onChange={(e) => setTargetStatus(e.target.value)}
                                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                                >
                                    <option value="Diproses">Diproses</option>
                                    <option value="Direvisi">Direvisi (Minta Revisi)</option>
                                    <option value="Selesai">Selesai (Tuntas)</option>
                                    <option value="Ditolak">Ditolak</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Catatan / Alasan {targetStatus === 'Direvisi' ? <span className="text-rose-500">* (Wajib)</span> : '(Opsional)'}
                                </label>
                                <textarea
                                    rows={3}
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    placeholder={targetStatus === 'Direvisi' ? 'Sebutkan dokumen atau perubahan yang perlu dilengkapi pemohon...' : 'Berikan catatan proses...'}
                                    className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white"
                                    required={targetStatus === 'Direvisi'}
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setUpdateModalOpen(false)}
                                    className="px-3 py-2 text-xs font-bold text-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingStatus}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs"
                                >
                                    {submittingStatus ? 'Menyimpan...' : 'Simpan Status'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

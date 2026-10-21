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
import CustomSelect from '../components/CustomSelect';
import api from '../services/api';
import {
    Search,
    Filter,
    Download,
    FileSpreadsheet,
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
    GripVertical,
    List,
    LayoutGrid,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    Video,
    Gift,
    Megaphone,
    Palette,
    Camera,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Phone,
    MapPin,
    User,
    Tag,
    Archive,
    ArchiveRestore,
    RotateCcw
} from 'lucide-react';

// --- Service definitions ---
const SERVICES = [
    { code: 'D', name: 'Layanan Desain Grafis', color: 'indigo' },
    { code: 'P', name: 'Layanan Publikasi Website & Social Media', color: 'sky' },
    { code: 'S', name: 'Layanan Permohonan Alat Promosi', color: 'amber' },
    { code: 'M', name: 'Layanan Multimedia, Dokumentasi, & Live Streaming', color: 'emerald' },
    { code: 'L', name: 'Layanan Liputan & Berita', color: 'rose' },
];

const serviceIconMap = {
    D: Palette,
    P: Megaphone,
    S: Gift,
    M: Video,
    L: Camera,
};

const serviceThemeMap = {
    D: { colorDot: 'bg-indigo-500', iconBg: 'bg-indigo-100 text-indigo-700' },
    P: { colorDot: 'bg-sky-500', iconBg: 'bg-sky-100 text-sky-700' },
    S: { colorDot: 'bg-amber-500', iconBg: 'bg-amber-100 text-amber-700' },
    M: { colorDot: 'bg-emerald-500', iconBg: 'bg-emerald-100 text-emerald-700' },
    L: { colorDot: 'bg-rose-500', iconBg: 'bg-rose-100 text-rose-700' },
};

// Kanban columns per service
const DEFAULT_KANBAN_COLUMNS = [
    { key: 'Diajukan', label: 'Diajukan', color: 'amber', bgCard: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-amber-100', textColor: 'text-amber-800' },
    { key: 'Diproses', label: 'Diproses', color: 'blue', bgCard: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100', textColor: 'text-blue-800' },
    { key: 'Direvisi', label: 'Direvisi', color: 'orange', bgCard: 'bg-orange-50', borderColor: 'border-orange-200', headerBg: 'bg-orange-100', textColor: 'text-orange-800' },
    { key: 'Selesai', label: 'Selesai', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
    { key: 'Ditolak', label: 'Ditolak', color: 'rose', bgCard: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-rose-100', textColor: 'text-rose-800' },
];

// Per-service status flows
const SERVICE_STATUS_FLOWS = {
    D: ['Diajukan', 'Diproses', 'Direvisi', 'Selesai', 'Ditolak'],
    P: ['Diajukan', 'Produksi/Pemeriksaan Konten', 'Proses Tayang', 'Selesai', 'Ditolak'],
    S: ['Diajukan', 'Menunggu Approval', 'Diproses', 'Selesai', 'Ditolak'],
    M: ['Diajukan', 'Diproses', 'Selesai', 'Ditolak'],
    L: ['Diajukan', 'Terjadwalkan/Produksi Berita', 'Selesai', 'Ditolak'],
};

const SERVICE_KANBAN = {
    D: [
        { key: 'Diajukan', label: 'Diajukan', color: 'amber', bgCard: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-amber-100', textColor: 'text-amber-800' },
        { key: 'Diproses', label: 'Diproses', color: 'blue', bgCard: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100', textColor: 'text-blue-800' },
        { key: 'Direvisi', label: 'Direvisi', color: 'orange', bgCard: 'bg-orange-50', borderColor: 'border-orange-200', headerBg: 'bg-orange-100', textColor: 'text-orange-800' },
        { key: 'Selesai', label: 'Selesai', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
        { key: 'Ditolak', label: 'Ditolak', color: 'rose', bgCard: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-rose-100', textColor: 'text-rose-800' },
    ],
    P: [
        { key: 'Diajukan', label: 'Diajukan', color: 'amber', bgCard: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-amber-100', textColor: 'text-amber-800' },
        { key: 'Produksi/Pemeriksaan Konten', label: 'Produksi/Pemeriksaan Konten', color: 'sky', bgCard: 'bg-sky-50', borderColor: 'border-sky-200', headerBg: 'bg-sky-100', textColor: 'text-sky-800' },
        { key: 'Proses Tayang', label: 'Proses Tayang', color: 'blue', bgCard: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100', textColor: 'text-blue-800' },
        { key: 'Selesai', label: 'Selesai', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
        { key: 'Ditolak', label: 'Ditolak', color: 'rose', bgCard: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-rose-100', textColor: 'text-rose-800' },
    ],
    S: [
        { key: 'Diajukan', label: 'Diajukan', color: 'amber', bgCard: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-amber-100', textColor: 'text-amber-800' },
        { key: 'Menunggu Approval', label: 'Menunggu Approval', color: 'purple', bgCard: 'bg-purple-50', borderColor: 'border-purple-200', headerBg: 'bg-purple-100', textColor: 'text-purple-800' },
        { key: 'Diproses', label: 'Diproses', color: 'blue', bgCard: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100', textColor: 'text-blue-800' },
        { key: 'Selesai', label: 'Selesai', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
        { key: 'Ditolak', label: 'Ditolak', color: 'rose', bgCard: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-rose-100', textColor: 'text-rose-800' },
    ],
    M: [
        { key: 'Diajukan', label: 'Diajukan', color: 'amber', bgCard: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-amber-100', textColor: 'text-amber-800' },
        { key: 'Diproses', label: 'Diproses', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
        { key: 'Selesai', label: 'Selesai', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
        { key: 'Ditolak', label: 'Ditolak', color: 'rose', bgCard: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-rose-100', textColor: 'text-rose-800' },
    ],
    L: [
        { key: 'Diajukan', label: 'Diajukan', color: 'amber', bgCard: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-amber-100', textColor: 'text-amber-800' },
        { key: 'Terjadwalkan/Produksi Berita', label: 'Terjadwalkan/Produksi Berita', color: 'blue', bgCard: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100', textColor: 'text-blue-800' },
        { key: 'Selesai', label: 'Selesai', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
        { key: 'Ditolak', label: 'Ditolak', color: 'rose', bgCard: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-rose-100', textColor: 'text-rose-800' },
    ],
};

const statusBadgeStyles = {
    'Diajukan': 'bg-amber-50 text-amber-800 border-amber-200',
    'Menunggu Approval': 'bg-purple-50 text-purple-800 border-purple-200',
    'Diproses': 'bg-blue-50 text-blue-800 border-blue-200',
    'Terjadwalkan/Produksi Berita': 'bg-blue-50 text-blue-800 border-blue-200',
    'Direvisi': 'bg-orange-50 text-orange-800 border-orange-200',
    'Produksi/Pemeriksaan Konten': 'bg-sky-50 text-sky-800 border-sky-200',
    'Proses Tayang': 'bg-blue-50 text-blue-800 border-blue-200',
    'Pemeriksaan Konten': 'bg-sky-50 text-sky-800 border-sky-200',
    'Publikasi': 'bg-blue-50 text-blue-800 border-blue-200',
    'Menunggu Approval Sebagian': 'bg-purple-50 text-purple-800 border-purple-200',
    'Selesai': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Ditolak': 'bg-rose-50 text-rose-800 border-rose-200',
};

function formatDateDisplay(val) {
    if (!val) return '-';
    const str = String(val).trim();
    if (!str || str === '-') return '-';

    const matchYMD = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchYMD) {
        const year = parseInt(matchYMD[1], 10);
        const monthIndex = parseInt(matchYMD[2], 10) - 1;
        const day = parseInt(matchYMD[3], 10);
        const d = new Date(year, monthIndex, day);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    return str;
}

function formatShortDate(val) {
    if (!val) return null;
    const str = String(val).trim();
    if (!str || str === '-') return null;

    const matchYMD = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchYMD) {
        const year = parseInt(matchYMD[1], 10);
        const monthIndex = parseInt(matchYMD[2], 10) - 1;
        const day = parseInt(matchYMD[3], 10);
        const d = new Date(year, monthIndex, day);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    return str;
}

function KanbanCard({ req, column, onOpenDetail, isDraggable, onDragStart, onDragEnd, onToggleArchive, isArchiving }) {
    const formData = (typeof req.form_data === 'string')
        ? (() => { try { return JSON.parse(req.form_data); } catch { return {}; } })()
        : (req.form_data || {});

    const serviceCode = req.service?.code || (req.kategori === 'Desain' ? 'D' : req.kategori === 'Publikasi' ? 'P' : req.kategori === 'Suvenir' ? 'S' : req.kategori === 'Multimedia' ? 'M' : req.kategori === 'Liputan' ? 'L' : null);

    let summaryTag = null;
    if (serviceCode === 'S') {
        const totalSouvenir = Array.isArray(formData.souvenir_items)
            ? formData.souvenir_items.reduce((acc, curr) => acc + (parseInt(curr.qty, 10) || 0), 0)
            : (req.suvenir_detail?.qty_diminta || 0);
        summaryTag = totalSouvenir > 0 ? `${totalSouvenir} Unit Suvenir` : (formData.kategori_kegiatan || null);
    } else if (serviceCode === 'D') {
        summaryTag = Array.isArray(formData.jenis_desain) && formData.jenis_desain.length > 0
            ? formData.jenis_desain[0] + (formData.jenis_desain.length > 1 ? ` +${formData.jenis_desain.length - 1}` : '')
            : (formData.ukuran_desain || null);
    } else if (serviceCode === 'P') {
        summaryTag = Array.isArray(formData.media_publikasi) && formData.media_publikasi.length > 0
            ? formData.media_publikasi[0]
            : (formData.tanggal_publikasi ? `Tayang: ${formData.tanggal_publikasi}` : null);
    } else if (serviceCode === 'M') {
        summaryTag = Array.isArray(formData.jenis_kebutuhan) && formData.jenis_kebutuhan.length > 0
            ? formData.jenis_kebutuhan[0]
            : (formData.lokasi_produksi || null);
    } else if (serviceCode === 'L') {
        summaryTag = Array.isArray(formData.jenis_peliputan) && formData.jenis_peliputan.length > 0
            ? formData.jenis_peliputan[0]
            : null;
    }

    const rawEventDate = formData.tanggal_kegiatan || formData.tanggal_dibutuhkan || req.tanggal_dibutuhkan || formData.deadline || formData.tanggal_publikasi || formData.tanggal_produksi;
    const eventDate = formatShortDate(rawEventDate);
    const canArchive = ['Selesai', 'Ditolak'].includes(req.status) || ['Selesai', 'Ditolak'].includes(column.key);

    return (
        <div
            draggable={isDraggable}
            onDragStart={isDraggable ? (e) => onDragStart(e, req) : undefined}
            onDragEnd={isDraggable ? onDragEnd : undefined}
            onClick={() => onOpenDetail(req.id)}
            className={`${column.bgCard} border ${column.borderColor} rounded-xl p-3.5 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
            {isDraggable && (
                <div className="flex items-center justify-between mb-1.5">
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                    <span className="text-[9px] text-slate-300 group-hover:text-slate-400 font-medium">geser</span>
                </div>
            )}

            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                        {req.nomor_tiket}
                    </span>
                    {req.is_archived && (
                        <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200">
                            <Archive className="w-2.5 h-2.5" />
                            <span>Archive</span>
                        </span>
                    )}
                </div>
                <span className="text-[10px] text-slate-400">
                    {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </span>
            </div>

            <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 mb-1.5">
                {req.judul_permohonan}
            </h4>

            {/* Badges Info Keterangan Form */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {req.service?.name || req.kategori || 'Layanan'}
                </span>
                {summaryTag && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 border border-slate-200 text-indigo-700 truncate max-w-[150px]">
                        {summaryTag}
                    </span>
                )}
                {req.status !== column.key && (
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeStyles[req.status] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        {req.status}
                    </span>
                )}
            </div>

            {/* Tanggal Pelaksanaan / Dibutuhkan jika ada */}
            {eventDate && (
                <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-medium mb-2 bg-white/70 px-2 py-1 rounded-md border border-slate-100">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">Target/Acara: {eventDate}</span>
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <div className="flex items-center space-x-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {(formData.nama_pemohon || req.user?.name)?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] text-slate-700 font-bold truncate block">{formData.nama_pemohon || req.requested_for?.name || req.user?.name}</span>
                        <span className="text-[9px] text-slate-400 truncate block">{formData.unit_pemohon || req.requested_for?.unit_kerja || req.user?.unit_kerja || 'Unit Kerja'}</span>
                        {(req.requested_for || formData.requested_for_name) && (
                            <span className="text-[8px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded truncate block mt-0.5">
                                Mewakili (via {req.user?.name})
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                    {req.calculated_lead_time && (
                        <div className="flex items-center space-x-0.5 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{req.calculated_lead_time}</span>
                        </div>
                    )}
                    {canArchive && onToggleArchive && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleArchive(req, e);
                            }}
                            disabled={isArchiving}
                            title={req.is_archived ? "Batal Archive (Kembalikan ke Papan Utama)" : "Archive Permohonan"}
                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 shadow-2xs hover:scale-105 active:scale-95 ${
                                req.is_archived
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                    : 'bg-white text-slate-600 hover:text-indigo-600 border-slate-200 hover:bg-slate-50'
                            } ${isArchiving ? 'opacity-40 cursor-wait' : ''}`}
                        >
                            {req.is_archived ? (
                                <>
                                    <ArchiveRestore className="w-3 h-3 text-amber-700" />
                                    <span>Batal Archive</span>
                                </>
                            ) : (
                                <>
                                    <Archive className="w-3 h-3 text-slate-500" />
                                    <span>Archive</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Lookup nama layanan secara utuh tanpa inisial seperti [D], [P], dsb.
const getFullServiceName = (obj) => {
    if (obj?.service?.name) return obj.service.name;
    const nameMap = {
        D: 'Layanan Desain Grafis',
        P: 'Layanan Publikasi Website & Social Media',
        S: 'Layanan Permohonan Alat Promosi',
        M: 'Layanan Multimedia, Dokumentasi, & Live Streaming',
        L: 'Layanan Liputan & Berita',
        Desain: 'Layanan Desain Grafis',
        Publikasi: 'Layanan Publikasi Website & Social Media',
        Suvenir: 'Layanan Permohonan Alat Promosi',
        Multimedia: 'Layanan Multimedia, Dokumentasi, & Live Streaming',
        Liputan: 'Layanan Liputan & Berita',
    };
    const code = obj?.service?.code || obj?.kategori || obj?.service_code;
    return nameMap[code] || obj?.kategori || 'Layanan Marketing';
};

// Detail section that shows form-specific fields
function RequestFormDetail({ detail, user, onRefresh }) {
    if (!detail) return null;
    const serviceCode = detail.service?.code || (detail.kategori === 'Desain' ? 'D' : detail.kategori === 'Publikasi' ? 'P' : detail.kategori === 'Suvenir' ? 'S' : detail.kategori === 'Multimedia' ? 'M' : detail.kategori === 'Liputan' ? 'L' : null);

    const formData = (typeof detail.form_data === 'string')
        ? (() => { try { return JSON.parse(detail.form_data); } catch { return {}; } })()
        : (detail.form_data || {});

    const cleanWaNumber = (phone) => phone ? phone.replace(/[^0-9]/g, '') : null;
    const waLink = (phone) => {
        const num = cleanWaNumber(phone);
        if (!num) return null;
        const normalized = num.startsWith('0') ? '62' + num.slice(1) : num;
        return `https://wa.me/${normalized}`;
    };

    const isPicForS = (user?.role === 'PIC' && (user?.pic_service_code === 'S' || user?.username?.toLowerCase() === 'bagas')) || user?.role === 'SuperAdmin';
    const isAdminApprover = user?.role === 'SuperAdmin';
    const canViewStock = ['SuperAdmin', 'PIC'].includes(user?.role);
    const canEditQuota = (detail.status === 'Diajukan' && isPicForS) || (detail.status === 'Menunggu Approval' && (isAdminApprover || isPicForS));

    const [inventoryStocks, setInventoryStocks] = useState({});
    const [souvenirEditItems, setSouvenirEditItems] = useState([]);
    const [picCatatan, setPicCatatan] = useState('');
    const [submittingPic, setSubmittingPic] = useState(false);
    const [adminCatatan, setAdminCatatan] = useState('');
    const [submittingAdmin, setSubmittingAdmin] = useState(false);
    const [actionMsg, setActionMsg] = useState(null);

    useEffect(() => {
        if (serviceCode === 'S') {
            api.get('/inventory?kategori=suvenir')
                .then(res => {
                    if (res.data?.data) {
                        const map = {};
                        res.data.data.forEach(item => {
                            map[item.nama_item] = item.stok_tersedia;
                        });
                        setInventoryStocks(map);
                    }
                })
                .catch(err => console.error('Error fetching inventory:', err));
        }
    }, [detail?.id, serviceCode]);

    useEffect(() => {
        if (serviceCode === 'S') {
            let initial = [];
            if (Array.isArray(formData?.souvenir_items) && formData.souvenir_items.length > 0) {
                initial = formData.souvenir_items.map(it => ({
                    nama_item: it.nama_item,
                    qty: parseInt(it.qty, 10) || 0,
                    qty_disetujui: it.qty_disetujui !== undefined ? parseInt(it.qty_disetujui, 10) : (parseInt(it.qty, 10) || 0)
                }));
            } else if (detail.suvenir_detail) {
                initial = [{
                    nama_item: detail.suvenir_detail.nama_item || 'Suvenir Kampus',
                    qty: parseInt(detail.suvenir_detail.qty_diminta, 10) || 0,
                    qty_disetujui: detail.suvenir_detail.qty_disetujui_otomatis !== undefined ? parseInt(detail.suvenir_detail.qty_disetujui_otomatis, 10) : (parseInt(detail.suvenir_detail.qty_diminta, 10) || 0)
                }];
            }
            setSouvenirEditItems(initial);
            setPicCatatan(formData?.pic_verification_note || detail.suvenir_detail?.catatan_approver || '');
            setAdminCatatan('');
            setActionMsg(null);
        }
    }, [detail?.id, serviceCode, detail.form_data]);

    const handleQtyChange = (idx, val) => {
        const num = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
        setSouvenirEditItems(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], qty_disetujui: num };
            return next;
        });
    };

    const handleConfirmQuotaByPic = async () => {
        setSubmittingPic(true);
        setActionMsg(null);
        try {
            const payload = {
                items: souvenirEditItems,
                catatan: picCatatan,
            };
            const res = await api.post(`/requests/${detail.id}/confirm-quota-pic`, payload);
            if (res.data?.status === 'success') {
                setActionMsg({ type: 'success', text: 'Perubahan unit suvenir berhasil disimpan!' });
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            console.error('Error confirming quota by PIC:', err);
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengonfirmasi kuota.' });
        } finally {
            setSubmittingPic(false);
        }
    };

    const handleAdminApprovalDecision = async (decision) => {
        setSubmittingAdmin(true);
        setActionMsg(null);
        try {
            const payload = {
                decision,
                catatan: adminCatatan,
                items: souvenirEditItems,
            };
            const res = await api.post(`/requests/${detail.id}/approve`, payload);
            if (res.data?.status === 'success') {
                setActionMsg({ type: 'success', text: `Permohonan berhasil ${decision === 'approve' ? 'disetujui' : 'ditolak'}!` });
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            console.error('Error submitting admin decision:', err);
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Gagal memproses persetujuan.' });
        } finally {
            setSubmittingAdmin(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* 1. INFORMASI UTAMA & STATUS TIKET */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Informasi Utama Permohonan</p>
                    <span className="font-mono text-xs font-bold text-slate-400">ID #{detail.id}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">No. Tiket</p>
                        <p className="font-mono font-black text-indigo-700 text-sm mt-0.5">{detail.nomor_tiket}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Layanan</p>
                        <p className="font-extrabold text-slate-800 text-xs mt-0.5">{getFullServiceName(detail)}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Status Permohonan</p>
                        <div className="mt-0.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusBadgeStyles[detail.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                {detail.status}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Tanggal & Waktu Pengajuan</p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                            {new Date(detail.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                            <span className="text-[11px] text-slate-400 block font-normal">
                                Pukul {new Date(detail.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Target / Tanggal Dibutuhkan</p>
                        <p className="font-bold text-slate-800 mt-0.5">
                            {formatDateDisplay(formData?.tanggal_dibutuhkan || detail.tanggal_dibutuhkan || formData?.deadline || formData?.tanggal_publikasi || formData?.tanggal_produksi)}
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Lead Time Proses</p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                            {detail.calculated_lead_time || '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. IDENTITAS PEMOHON LENGKAP */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">1. Identitas Unit Pemohon</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Lengkap Pemohon</span>
                        <span className="font-extrabold text-slate-900 text-xs">
                            {formData?.nama_pemohon || detail.user?.name || '-'}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Unit Pemohon</span>
                        <span className="font-semibold text-slate-800 text-xs">
                            {formData?.unit_pemohon || detail.user?.unit_kerja || '-'}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">No. WhatsApp Pemohon</span>
                        {formData?.no_whatsapp_pemohon ? (
                            <a
                                href={waLink(formData.no_whatsapp_pemohon)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-0.5"
                                title="Buka WhatsApp pemohon"
                            >
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{formData.no_whatsapp_pemohon}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        ) : (
                            <span className="text-slate-400 font-medium">-</span>
                        )}
                    </div>
                    {(detail.requested_for || detail.requested_for_id) && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center space-x-1.5 text-slate-500">
                                <span className="text-[11px]">Diajukan oleh:</span>
                                <strong className="text-slate-800">{detail.user?.name}</strong>
                                <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                    {detail.user?.role}
                                </span>
                            </div>
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-semibold">
                                <span>Mewakili Pemohon:</span>
                                <span className="font-bold underline">{detail.requested_for?.name || formData?.requested_for_name || 'User Terdaftar'}</span>
                                {(detail.requested_for?.unit_kerja || formData?.requested_for_unit) && (
                                    <span className="text-indigo-600 font-normal">
                                        ({detail.requested_for?.unit_kerja || formData?.requested_for_unit})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. RINCIAN SPESIFIK SESUAI FORMULIR LAYANAN */}
            {/* ------------------------------------------------------------- */}
            {/* A. LAYANAN ALAT PROMOSI & SUVENIR [S]                          */}
            {/* ------------------------------------------------------------- */}
            {serviceCode === 'S' && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                        <h4 className="font-black text-amber-950 flex items-center space-x-2 text-xs">
                            <Gift className="w-4 h-4 text-amber-600" />
                            <span>Rincian Pengajuan Alat Promosi & Suvenir</span>
                        </h4>
                        {formData?.kategori_kegiatan && (
                            <span className="px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-full text-[10px] font-black">
                                Kategori: {formData.kategori_kegiatan}
                            </span>
                        )}
                    </div>

                    {/* Informasi Kegiatan / Program */}
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Informasi Kegiatan / Program</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-3.5 rounded-xl border border-amber-200 text-slate-700">
                            <div className="sm:col-span-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Kegiatan / Program</span>
                                <span className="font-extrabold text-slate-900 text-xs">{formData?.nama_kegiatan || detail.judul_permohonan || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Kegiatan</span>
                                <span className="font-semibold text-slate-800">{formatDateDisplay(formData?.tanggal_kegiatan)}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Kegiatan</span>
                                <span className="font-semibold text-slate-800">{formData?.waktu_kegiatan ? `${formData.waktu_kegiatan} WIB` : '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Lokasi Kegiatan</span>
                                <span className="font-semibold text-slate-800">{formData?.lokasi_kegiatan || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Suvenir Dibutuhkan</span>
                                <span className="font-bold text-amber-900">{formatDateDisplay(formData?.tanggal_dibutuhkan || detail.tanggal_dibutuhkan)}</span>
                            </div>
                            <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama PIC Kegiatan</span>
                                    <span className="font-bold text-slate-900">{formData?.nama_pic_kegiatan || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">No. WhatsApp PIC Kegiatan</span>
                                    {formData?.no_whatsapp_pic ? (
                                        <a href={waLink(formData.no_whatsapp_pic)} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 font-bold text-emerald-700 hover:underline">
                                            <Phone className="w-3 h-3 text-emerald-600" />
                                            <span>{formData.no_whatsapp_pic}</span>
                                        </a>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Keperluan Souvenir (Jenis & Qty) */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Keperluan Souvenir yang Diajukan</p>
                            <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 bg-amber-200 text-amber-950 font-black text-[10px] rounded-lg">
                                    Total Diminta: {souvenirEditItems.reduce((acc, curr) => acc + (parseInt(curr.qty, 10) || 0), 0)} Unit
                                </span>
                                {detail.status !== 'Diajukan' && (
                                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-950 font-black text-[10px] rounded-lg">
                                        Total Disetujui: {souvenirEditItems.reduce((acc, curr) => acc + (parseInt(curr.qty_disetujui, 10) || 0), 0)} Unit
                                    </span>
                                )}
                            </div>
                        </div>

                        {actionMsg && (
                            <div className={`p-3 rounded-xl text-xs font-semibold ${actionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                {actionMsg.text}
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-amber-200 overflow-x-auto custom-scrollbar shadow-2xs">
                            <table className="w-full min-w-[480px] text-left text-xs">
                                <thead className="bg-amber-100/70 text-amber-900 font-bold border-b border-amber-200 text-[11px]">
                                    <tr>
                                        <th className="px-3 py-2 w-10">No</th>
                                        <th className="px-3 py-2">Nama Item Suvenir</th>
                                        <th className="px-3 py-2 text-center w-24">Jumlah Diminta</th>
                                        {canViewStock && (
                                            <th className="px-3 py-2 text-center w-28">Stok Gudang</th>
                                        )}
                                        <th className="px-3 py-2 text-right w-36">
                                            {canEditQuota ? 'Unit Disetujui' : 'Disetujui'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {souvenirEditItems.map((it, idx) => {
                                        const stock = inventoryStocks[it.nama_item];
                                        const isLowStock = stock !== undefined && stock < it.qty;
                                        return (
                                            <tr key={idx} className="hover:bg-amber-50/40">
                                                <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                                <td className="px-3 py-2.5 font-bold text-slate-800">
                                                    {it.nama_item}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-700">
                                                    {it.qty} unit
                                                </td>
                                                {canViewStock && (
                                                    <td className="px-3 py-2.5 text-center">
                                                        {stock !== undefined ? (
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${isLowStock ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                                                                {stock} unit
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 font-medium">-</span>
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-3 py-2.5 text-right">
                                                    {canEditQuota ? (
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={it.qty_disetujui}
                                                                onChange={(e) => handleQtyChange(idx, e.target.value)}
                                                                className="w-16 px-2 py-1 text-xs font-mono font-black text-amber-950 bg-amber-50 rounded-lg border border-amber-300 text-right focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                                                            />
                                                            <span className="text-[11px] font-bold text-amber-900">unit</span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-mono font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                            {it.qty_disetujui !== undefined ? it.qty_disetujui : it.qty} unit
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Aksi PIC saat Status Diajukan */}
                        {detail.status === 'Diajukan' && isPicForS && (
                            <div className="p-3.5 bg-amber-100/60 rounded-xl border border-amber-300/80 space-y-2.5 mt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center space-x-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Konfirmasi Alokasi Kuota oleh PIC</span>
                                    </span>
                                    <span className="text-[11px] font-bold text-amber-900">
                                        Total Dialokasikan: <strong>{souvenirEditItems.reduce((acc, c) => acc + (c.qty_disetujui || 0), 0)} unit</strong>
                                    </span>
                                </div>
                                <p className="text-[11px] text-amber-800">
                                    Atur jumlah unit yang disetujui pada tabel di atas sesuai stok fisik di gudang, lalu klik tombol di bawah untuk meneruskan ke Admin untuk persetujuan.
                                </p>
                                <div>
                                    <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">
                                        Catatan Verifikasi PIC (Opsional):
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={picCatatan}
                                        onChange={(e) => setPicCatatan(e.target.value)}
                                        placeholder="Contoh: Stok Goodiebag mencukupi, Brosur S1 disesuaikan kuota..."
                                        className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleConfirmQuotaByPic}
                                    disabled={submittingPic}
                                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{submittingPic ? 'Menyimpan & Meneruskan...' : 'Konfirmasi Kuota & Teruskan ke Admin'}</span>
                                </button>
                            </div>
                        )}

                        {/* Aksi Admin / PIC saat Status Menunggu Approval */}
                        {detail.status === 'Menunggu Approval' && (
                            <div className="space-y-2 mt-2">
                                {(detail.suvenir_detail?.catatan_approver || formData?.pic_verification_note) && (
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                                        <span className="font-bold text-amber-900 block mb-0.5">Catatan Verifikasi dari PIC:</span>
                                        <p className="text-slate-700">{detail.suvenir_detail?.catatan_approver || formData?.pic_verification_note}</p>
                                    </div>
                                )}

                                {isAdminApprover ? (
                                    <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-300 space-y-3">
                                        <div>
                                            <h5 className="font-bold text-purple-950 text-xs">Persetujuan Permohonan oleh Admin / Pimpinan</h5>
                                            <p className="text-[11px] text-purple-800 mt-0.5">
                                                Anda dapat mengedit jumlah unit disetujui pada tabel di atas jika diperlukan. Menyetujui permohonan ini akan mengubah status menjadi <strong>Diproses</strong> dan otomatis memotong stok barang di inventaris sesuai unit yang disetujui.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-purple-900 uppercase mb-1">
                                                Catatan Admin (Opsional):
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={adminCatatan}
                                                onChange={(e) => setAdminCatatan(e.target.value)}
                                                placeholder="Contoh: Disetujui untuk kegiatan promosi kampus..."
                                                className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-purple-300 focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400 outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => handleAdminApprovalDecision('approve')}
                                                disabled={submittingAdmin}
                                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>{submittingAdmin ? 'Memproses...' : 'Setujui (Approve & Potong Stok)'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleAdminApprovalDecision('reject')}
                                                disabled={submittingAdmin}
                                                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                <span>Tolak Permohonan</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : isPicForS ? (
                                    <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-300 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-purple-950 flex items-center space-x-1.5">
                                                <Clock className="w-4 h-4 text-purple-600" />
                                                <span>Status: Menunggu Approval Admin</span>
                                            </span>
                                            <span className="text-[11px] font-bold text-purple-900">
                                                Total Dialokasikan: <strong>{souvenirEditItems.reduce((acc, c) => acc + (c.qty_disetujui || 0), 0)} unit</strong>
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-purple-800">
                                            Sebagai PIC, Anda masih dapat mengedit jumlah unit barang yang diajukan pada tabel di atas jika terdapat penyesuaian kuota. Klik tombol di bawah untuk menyimpan perubahan unit barang.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleConfirmQuotaByPic}
                                            disabled={submittingPic}
                                            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>{submittingPic ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Unit Barang'}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                                        <span>Kuota suvenir telah diverifikasi oleh PIC. Saat ini sedang menunggu persetujuan (approval) dari Admin.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status Ringkasan Kuota Suvenir */}
                    <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Status Persetujuan Kuota Suvenir</p>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Diminta</p>
                                <p className="text-base font-black text-slate-900 mt-0.5">
                                    {souvenirEditItems.reduce((acc, curr) => acc + (parseInt(curr.qty, 10) || 0), 0)} unit
                                </p>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                                <p className="text-[10px] text-amber-800 font-bold uppercase">Status Persetujuan</p>
                                <p className="text-xs font-black text-amber-900 mt-1">
                                    {detail.status === 'Diajukan' ? 'Menunggu Verifikasi PIC' :
                                        detail.status === 'Menunggu Approval' ? 'Menunggu Approval Admin' :
                                            detail.status === 'Diproses' ? `${souvenirEditItems.reduce((acc, curr) => acc + (parseInt(curr.qty_disetujui, 10) || 0), 0)} unit (Disetujui Admin)` :
                                                detail.status === 'Selesai' ? `${souvenirEditItems.reduce((acc, curr) => acc + (parseInt(curr.qty_disetujui, 10) || 0), 0)} unit (Selesai)` :
                                                    detail.status === 'Ditolak' ? 'Ditolak' : detail.status}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* B. LAYANAN MULTIMEDIA, DOKUMENTASI, & PODCAST [M]             */}
            {/* ------------------------------------------------------------- */}
            {serviceCode === 'M' && (
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                        <h4 className="font-black text-emerald-950 flex items-center space-x-1.5 text-xs">
                            <Video className="w-4 h-4 text-emerald-600" />
                            <span>Rincian Pengajuan Layanan Multimedia</span>
                        </h4>
                        {Array.isArray(formData?.jenis_kebutuhan) && formData.jenis_kebutuhan.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {formData.jenis_kebutuhan.map((jk, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                                        {jk}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-emerald-100 text-slate-700">
                        <div className="sm:col-span-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Kegiatan / Program</span>
                            <span className="font-extrabold text-slate-900 text-xs">{formData?.nama_kegiatan || detail.judul_permohonan || '-'}</span>
                        </div>
                        {(detail.multimedia_detail || formData?.tanggal_produksi) && (
                            <>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Jadwal Syuting / Produksi</span>
                                    <span className="font-bold text-slate-900">
                                        {formatDateDisplay(detail.multimedia_detail?.tanggal_pelaksanaan || formData?.tanggal_produksi)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Operasional / Booking</span>
                                    <span className="font-bold text-slate-900">
                                        {detail.multimedia_detail ? `${detail.multimedia_detail.jam_mulai?.slice(0, 5)} - ${detail.multimedia_detail.jam_selesai?.slice(0, 5)} WIB (${formatDurasi(detail.multimedia_detail.durasi_menit)})` : (formData?.jam_mulai ? `${formData.jam_mulai} - ${formData.jam_selesai} WIB` : '-')}
                                    </span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Ruangan / Lokasi Alat</span>
                                    <span className="font-bold text-slate-900">
                                        {detail.multimedia_detail?.lokasi_alat || formData?.lokasi_produksi || '-'}
                                    </span>
                                </div>
                            </>
                        )}
                        {(formData?.target_penyelesaian || formData?.deadline) && (
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase block">Target Penyelesaian (Deadline Editor)</span>
                                <span className="font-bold text-blue-900">
                                    {formatDateDisplay(formData?.target_penyelesaian || formData?.deadline)}
                                </span>
                            </div>
                        )}
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Output yang Diharapkan</span>
                            <span className="font-bold text-slate-900">
                                {formData?.output_diharapkan || '-'}
                            </span>
                        </div>
                        {formData?.narasumber_talent && (
                            <div className="sm:col-span-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Narasumber / Talent</span>
                                <span className="font-semibold text-slate-800">{formData.narasumber_talent}</span>
                            </div>
                        )}
                        {formData?.konsep_konten && (
                            <div className="sm:col-span-2 p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                <span className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">Konsep & Kebutuhan Konten</span>
                                <p className="text-xs text-slate-700 whitespace-pre-wrap">{formData.konsep_konten}</p>
                            </div>
                        )}
                        {formData?.link_drive && (
                            <div className="sm:col-span-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Link Materi Pendukung (Google Drive)</span>
                                <a href={formData.link_drive} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline truncate block">
                                    {formData.link_drive}
                                </a>
                            </div>
                        )}
                        {(formData?.nama_pic_kegiatan || formData?.no_whatsapp_pic) && (
                            <div className="sm:col-span-2 text-[11px] text-slate-600 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                <span>PIC Lapangan: <strong>{formData.nama_pic_kegiatan || '-'}</strong></span>
                                {formData.no_whatsapp_pic && (
                                    <a href={waLink(formData.no_whatsapp_pic)} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline inline-flex items-center space-x-1">
                                        <Phone className="w-3 h-3 text-emerald-600" />
                                        <span>WA: {formData.no_whatsapp_pic}</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* C. LAYANAN PUBLIKASI WEBSITE & SOCIAL MEDIA [P]               */}
            {/* ------------------------------------------------------------- */}
            {serviceCode === 'P' && (
                <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
                        <h4 className="font-black text-sky-950 flex items-center space-x-1.5 text-xs">
                            <Megaphone className="w-4 h-4 text-sky-600" />
                            <span>Rincian Pengajuan Publikasi Medsos & Website</span>
                        </h4>
                        {formData?.tanggal_publikasi && (
                            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[10px] font-black">
                                Target Tayang: {formatDateDisplay(formData.tanggal_publikasi)}
                            </span>
                        )}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-sky-100 space-y-3 text-slate-700">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Kegiatan</span>
                            <span className="font-extrabold text-slate-900 text-xs">{formData?.nama_kegiatan || detail.judul_permohonan || '-'}</span>
                        </div>

                        {Array.isArray(formData?.media_publikasi) && formData.media_publikasi.length > 0 && (
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kanal Media Publikasi</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {formData.media_publikasi.map((m, idx) => (
                                        <span key={idx} className="px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg text-xs font-bold">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formData?.isi_caption && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Draft Isi / Caption</span>
                                <p className="text-xs text-slate-800 whitespace-pre-wrap">{formData.isi_caption}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                            {formData?.tag_mention && (
                                <div>
                                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Tag / Mention Akun:</span>
                                    <span className="font-bold text-sky-700">{formData.tag_mention}</span>
                                </div>
                            )}
                            {formData?.link_drive && (
                                <div>
                                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Link Google Drive Materi:</span>
                                    <a href={formData.link_drive} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline truncate block">
                                        {formData.link_drive}
                                    </a>
                                </div>
                            )}
                        </div>

                        {(formData?.nama_pic_publikasi || formData?.kontak_pic_publikasi) && (
                            <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                <span>PIC Pengaju Publikasi: <strong>{formData.nama_pic_publikasi || '-'}</strong></span>
                                {formData.kontak_pic_publikasi && (
                                    <a href={waLink(formData.kontak_pic_publikasi)} target="_blank" rel="noreferrer" className="text-sky-700 font-bold hover:underline inline-flex items-center space-x-1">
                                        <Phone className="w-3 h-3 text-sky-600" />
                                        <span>WA: {formData.kontak_pic_publikasi}</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* D. LAYANAN DESAIN GRAFIS [D]                                  */}
            {/* ------------------------------------------------------------- */}
            {serviceCode === 'D' && (
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                        <h4 className="font-black text-indigo-950 flex items-center space-x-1.5 text-xs">
                            <Palette className="w-4 h-4 text-indigo-600" />
                            <span>Rincian Pengajuan Desain Grafis</span>
                        </h4>
                        {formData?.deadline && (
                            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black">
                                Deadline: {formatDateDisplay(formData.deadline)}
                            </span>
                        )}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-3 text-slate-700">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Kegiatan / Tema</span>
                            <span className="font-extrabold text-slate-900 text-xs">{formData?.judul_tema || formData?.nama_kegiatan || detail.judul_permohonan || '-'}</span>
                        </div>

                        {Array.isArray(formData?.jenis_desain) && formData.jenis_desain.length > 0 && (
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Jenis Desain yang Diminta</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {formData.jenis_desain.map((jd, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md text-[11px] font-bold">
                                            {jd}
                                        </span>
                                    ))}
                                    {formData?.jenis_desain_lainnya && (
                                        <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-md text-[11px] font-bold">
                                            {formData.jenis_desain_lainnya}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                            {formData?.ukuran_desain && (
                                <div>
                                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Ukuran Desain:</span>
                                    <span className="font-bold text-slate-800">{formData.ukuran_desain}</span>
                                </div>
                            )}
                            {formData?.media_penggunaan && (
                                <div>
                                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Media Penggunaan:</span>
                                    <span className="font-bold text-slate-800">{formData.media_penggunaan}</span>
                                </div>
                            )}
                            {formData?.referensi_desain && (
                                <div>
                                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Referensi Desain:</span>
                                    <span className="font-bold text-indigo-700 truncate block">{formData.referensi_desain}</span>
                                </div>
                            )}
                        </div>

                        {formData?.informasi_dicantumkan && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Informasi Wajib Dicantumkan</span>
                                <p className="text-xs text-slate-800 whitespace-pre-wrap">{formData.informasi_dicantumkan}</p>
                            </div>
                        )}

                        {(formData?.nama_pic_kegiatan || formData?.no_whatsapp_pic) && (
                            <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                <span>PIC Pengaju: <strong>{formData.nama_pic_kegiatan || '-'}</strong></span>
                                {formData.no_whatsapp_pic && (
                                    <a href={waLink(formData.no_whatsapp_pic)} target="_blank" rel="noreferrer" className="text-indigo-700 font-bold hover:underline inline-flex items-center space-x-1">
                                        <Phone className="w-3 h-3 text-indigo-600" />
                                        <span>WA: {formData.no_whatsapp_pic}</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* E. LAYANAN PELIPUTAN & BERITA [L]                             */}
            {/* ------------------------------------------------------------- */}
            {serviceCode === 'L' && (
                <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                        <h4 className="font-black text-rose-950 flex items-center space-x-1.5 text-xs">
                            <Camera className="w-4 h-4 text-rose-600" />
                            <span>Rincian Pengajuan Peliputan & Berita</span>
                        </h4>
                        {Array.isArray(formData?.jenis_peliputan) && formData.jenis_peliputan.length > 0 && (
                            <div className="flex gap-1">
                                {formData.jenis_peliputan.map((jp, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px] font-bold">
                                        {jp}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-rose-100 space-y-2.5 text-slate-700">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Kegiatan</span>
                            <span className="font-extrabold text-slate-900 text-xs">{formData?.nama_kegiatan || detail.judul_permohonan || '-'}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Peliputan</span>
                                <span className="font-bold text-slate-900">
                                    {formatDateDisplay(formData?.waktu_peliputan || detail.tanggal_dibutuhkan)}
                                </span>
                            </div>
                            {formData?.pimpinan_tamu_hadir && (
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Pimpinan / Tamu yang Hadir</span>
                                    <span className="font-bold text-slate-900">{formData.pimpinan_tamu_hadir}</span>
                                </div>
                            )}
                        </div>

                        {formData?.rundown_acara && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Rundown Acara</span>
                                <p className="text-xs text-slate-800 whitespace-pre-wrap">{formData.rundown_acara}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 4. DESKRIPSI & SPESIFIKASI TAMBAHAN */}
            {detail.deskripsi_kebutuhan && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ringkasan / Catatan Deskripsi Permohonan</p>
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                        {detail.deskripsi_kebutuhan}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function TrackingPage({ defaultSelectedId }) {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

    // Pagination state (10 baris per halaman)
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    // Filter states
    const isPic = user?.role === 'PIC';
    const fallbackPicMap = { ahmad: 'D', nurhaliza: 'P', bagas: 'S', dewi: 'M', rizky: 'L' };
    const picServiceCode = isPic ? (user?.pic_service_code || fallbackPicMap[user?.username?.toLowerCase()] || null) : null;
    const [serviceFilter, setServiceFilter] = useState(picServiceCode || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [dateSort, setDateSort] = useState('desc'); // 'desc' (Terbaru) | 'asc' (Terlama)
    const [showArchived, setShowArchived] = useState(false); // Toggle lihat archive vs aktif
    const [statusFilter, setStatusFilter] = useState(''); // Filter status per-layanan
    const [archivingId, setArchivingId] = useState(null);
    const [archiveConfirmModal, setArchiveConfirmModal] = useState({ isOpen: false, req: null, willArchive: true });

    // Active service: for PIC it is strictly locked to their service code
    const activeService = isPic ? (picServiceCode || '') : serviceFilter;

    // Detail modal states
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Status update modal
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [targetStatus, setTargetStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [revisionFiles, setRevisionFiles] = useState([]);
    const [submittingStatus, setSubmittingStatus] = useState(false);
    const [statusError, setStatusError] = useState(null);

    // Drag-and-drop (admin/superadmin/PIC)
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [dragUpdating, setDragUpdating] = useState(false);

    const scrollRef = useRef(null);
    const scrollAnimRef = useRef(null);

    const isAdmin = user?.role === 'SuperAdmin';
    const canDrag = isAdmin || isPic;
    const canUpdateStatus = isAdmin || isPic;

    // Get service-specific kanban columns (Di mode Archive, HANYA tampilkan status Selesai & Ditolak)
    const activeKanbanColumns = React.useMemo(() => {
        const base = activeService
            ? (SERVICE_KANBAN[activeService] || DEFAULT_KANBAN_COLUMNS)
            : DEFAULT_KANBAN_COLUMNS;
        if (showArchived) {
            return base.filter(col => ['Selesai', 'Ditolak'].includes(col.key));
        }
        return base;
    }, [activeService, showArchived]);

    // Get available status options for update modal based on service
    const getStatusOptions = (customServiceCode = null) => {
        const code = customServiceCode || selectedDetail?.service?.code || activeService;
        const flow = SERVICE_STATUS_FLOWS[code] || ['Diajukan', 'Diproses', 'Direvisi', 'Selesai', 'Ditolak'];
        return flow.filter(s => s !== 'Diajukan');
    };

    const loadRequests = async (overrideArchived = null, overrideStatus = null) => {
        if (!activeService) {
            setRequests([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const isArchivedParam = overrideArchived !== null ? overrideArchived : showArchived;
            const currentStatus = overrideStatus !== null ? overrideStatus : statusFilter;
            const params = new URLSearchParams();
            params.append('per_page', '500');
            params.append('service_code', activeService);
            params.append('is_archived', isArchivedParam ? '1' : '0');
            if (currentStatus) params.append('status', currentStatus);
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

    // Auto-sync PIC service code when user auth loads
    useEffect(() => {
        if (isPic && picServiceCode && serviceFilter !== picServiceCode) {
            setServiceFilter(picServiceCode);
        }
    }, [user, isPic, picServiceCode]);

    useEffect(() => {
        loadRequests();
    }, [activeService, searchTerm, showArchived, statusFilter, user]);

    // Reset pagination to page 1 whenever filters or service change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeService, searchTerm, statusFilter, dateFrom, dateTo, dateSort, showArchived]);

    // Trigger custom confirmation modal instead of browser window.confirm
    const handleToggleArchive = (req, e = null) => {
        if (e) e.stopPropagation();
        setArchiveConfirmModal({
            isOpen: true,
            req,
            willArchive: !req.is_archived,
        });
    };

    // Execute archive / unarchive after user confirms in the custom modal
    const handleConfirmArchive = async () => {
        if (!archiveConfirmModal.req) return;
        const req = archiveConfirmModal.req;
        const willArchive = archiveConfirmModal.willArchive;

        setArchivingId(req.id);
        try {
            const res = await api.post(`/requests/${req.id}/archive`, { is_archived: willArchive });
            if (res.data?.status === 'success') {
                setRequests(prev => prev.map(r => r.id === req.id ? { ...r, is_archived: willArchive, archived_at: willArchive ? new Date().toISOString() : null } : r));
                if (selectedDetail && selectedDetail.id === req.id) {
                    setSelectedDetail(prev => prev ? { ...prev, is_archived: willArchive, archived_at: willArchive ? new Date().toISOString() : null } : null);
                }
                setArchiveConfirmModal({ isOpen: false, req: null, willArchive: true });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memperbarui status archive.');
        } finally {
            setArchivingId(null);
        }
    };

    const openDetail = async (id) => {
        setLoadingDetail(true);
        setRevisionFiles([]);
        try {
            const res = await api.get(`/requests/${id}`);
            if (res.data?.status === 'success') {
                setSelectedDetail(res.data.data);
                // Pre-select next logical status
                const flow = SERVICE_STATUS_FLOWS[res.data.data.service?.code] || getStatusOptions(res.data.data.service?.code);
                const currentIdx = flow.indexOf(res.data.data.status);
                const nextStatus = flow[currentIdx + 1] || flow[flow.length - 2] || 'Diproses';
                setTargetStatus(nextStatus);
            }
        } catch (err) {
            alert('Gagal memuat detail permohonan.');
        } finally {
            setLoadingDetail(false);
        }
    };

    // Shortcut to open status update modal directly from table or kanban
    const openUpdateModalForReq = (req) => {
        setStatusError(null);
        setStatusNote('');
        setRevisionFiles([]);
        setSelectedDetail(req);
        const reqServiceCode = req.service?.code || activeService;
        const flow = SERVICE_STATUS_FLOWS[reqServiceCode] || ['Diajukan', 'Diproses', 'Direvisi', 'Selesai', 'Ditolak'];
        const currentIdx = flow.indexOf(req.status);
        const nextStatus = flow[currentIdx + 1] || flow[flow.length - 2] || 'Diproses';
        setTargetStatus(nextStatus);
        setUpdateModalOpen(true);
    };

    const handleRevisionFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setRevisionFiles(prev => {
            const existingKeys = new Set(prev.map(f => `${f.name}-${f.size}`));
            const newFiles = files.filter(f => !existingKeys.has(`${f.name}-${f.size}`));
            return [...prev, ...newFiles];
        });
        e.target.value = '';
    };

    const removeRevisionFile = (indexToRemove) => {
        setRevisionFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    useEffect(() => {
        if (defaultSelectedId) {
            openDetail(defaultSelectedId);
        }
    }, [defaultSelectedId]);

    const handleUpdateStatusSubmit = async (e) => {
        e.preventDefault();
        setStatusError(null);

        // For PIC, notes are always required when changing status
        const requiresNote = isPic || ['Ditolak', 'Direvisi'].includes(targetStatus);
        if (requiresNote && !statusNote.trim()) {
            setStatusError('Kolom catatan wajib diisi untuk perubahan status ini.');
            return;
        }

        setSubmittingStatus(true);
        try {
            const formData = new FormData();
            formData.append('status', targetStatus);
            formData.append('catatan', statusNote);
            if (revisionFiles && revisionFiles.length > 0) {
                revisionFiles.forEach(file => {
                    formData.append('revision_files[]', file);
                });
            }

            const res = await api.post(`/requests/${selectedDetail.id}/status`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.status === 'success') {
                setRequests(prev => prev.map(r => r.id === selectedDetail.id ? { ...r, status: targetStatus } : r));
                if (res.data?.data) {
                    setSelectedDetail(res.data.data);
                } else {
                    setSelectedDetail(prev => prev ? { ...prev, status: targetStatus } : null);
                }
                setUpdateModalOpen(false);
                setStatusNote('');
                setRevisionFiles([]);
                loadRequests();
            }
        } catch (err) {
            setStatusError(err.response?.data?.message || 'Gagal mengubah status.');
        } finally {
            setSubmittingStatus(false);
        }
    };

    // Drag handlers
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

    const handleDragLeave = () => setDragOverColumn(null);

    const handleBoardDragOver = useCallback((e) => {
        const container = scrollRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const ZONE = 100;
        const SPEED = 12;
        const distRight = rect.right - e.clientX;
        const distLeft = e.clientX - rect.left;
        if (scrollAnimRef.current) { cancelAnimationFrame(scrollAnimRef.current); scrollAnimRef.current = null; }
        if (distRight < ZONE && distRight > 0) {
            const intensity = 1 - distRight / ZONE;
            const step = () => { container.scrollLeft += SPEED * intensity; scrollAnimRef.current = requestAnimationFrame(step); };
            scrollAnimRef.current = requestAnimationFrame(step);
        } else if (distLeft < ZONE && distLeft > 0) {
            const intensity = 1 - distLeft / ZONE;
            const step = () => { container.scrollLeft -= SPEED * intensity; scrollAnimRef.current = requestAnimationFrame(step); };
            scrollAnimRef.current = requestAnimationFrame(step);
        }
    }, []);

    const handleDrop = async (e, targetColumnKey) => {
        e.preventDefault();
        setDragOverColumn(null);
        if (!draggedItem || draggedItem.status === targetColumnKey) { setDraggedItem(null); return; }
        setDragUpdating(true);
        try {
            const res = await api.patch(`/requests/${draggedItem.id}/status`, {
                status: targetColumnKey,
                catatan: `Status diperbarui via Kanban: ${draggedItem.status} → ${targetColumnKey}`,
            });
            if (res.data?.status === 'success') {
                setRequests(prev => prev.map(r => r.id === draggedItem.id ? { ...r, status: targetColumnKey } : r));
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
        if (scrollAnimRef.current) { cancelAnimationFrame(scrollAnimRef.current); scrollAnimRef.current = null; }
    };

    const handleExport = (format) => {
        const params = new URLSearchParams();
        if (activeService) params.append('service_code', activeService);
        params.append('is_archived', showArchived ? '1' : '0');
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter && statusFilter !== 'Semua') params.append('status', statusFilter);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        window.open(`/api/v1/export/${format}?${params.toString()}`, '_blank');
    };

    // Filter and sort requests based on date range and sort order (applies to both Kanban and Table)
    const processedRequests = React.useMemo(() => {
        let result = [...requests];

        // 0. Filter Archive vs Aktif
        result = result.filter(r => showArchived ? !!r.is_archived : !r.is_archived);

        // Di mode Archive, HANYA tampilkan status 'Selesai' dan 'Ditolak'
        if (showArchived) {
            result = result.filter(r => ['Selesai', 'Ditolak'].includes(r.status));
        }

        // 1. Filter Status jika dipilih
        if (statusFilter) {
            result = result.filter(r => r.status === statusFilter);
        }

        // 2. Date Range Filtering
        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            result = result.filter(r => new Date(r.created_at) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(r => new Date(r.created_at) <= to);
        }

        // 3. Date Sorting (Terbaru / Terlama)
        result.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return dateSort === 'asc' ? timeA - timeB : timeB - timeA;
        });

        return result;
    }, [requests, showArchived, statusFilter, dateFrom, dateTo, dateSort]);

    // Pagination calculation for Table view (10 rows per page)
    const totalItems = processedRequests.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const paginatedRequests = React.useMemo(() => {
        const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        return processedRequests.slice(start, start + ITEMS_PER_PAGE);
    }, [processedRequests, safeCurrentPage]);

    const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems);

    const pageNumbers = React.useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (safeCurrentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }
        if (safeCurrentPage >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
    }, [safeCurrentPage, totalPages]);

    // Group requests for kanban
    const groupedRequests = React.useMemo(() => {
        const grouped = {};
        activeKanbanColumns.forEach(col => { grouped[col.key] = []; });
        processedRequests.forEach(req => {
            if (grouped[req.status]) {
                grouped[req.status].push(req);
            } else if (!activeService) {
                // Map intermediate service-specific statuses into Diproses column when viewing all services
                if (['Pemeriksaan Konten', 'Produksi/Pemeriksaan Konten', 'Publikasi', 'Proses Tayang', 'Menunggu Approval Sebagian', 'Terjadwalkan/Produksi Berita'].includes(req.status)) {
                    if (grouped['Diproses']) grouped['Diproses'].push(req);
                } else if (grouped['Diajukan']) {
                    grouped['Diajukan'].push(req);
                }
            }
        });
        return grouped;
    }, [processedRequests, activeKanbanColumns, activeService]);

    // Service lookup
    const getServiceName = (req) => req.service?.name || req.kategori || '-';

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            {isPic ? 'Daftar Permohonan Layanan Saya' : 'Tracking Permohonan & Riwayat Status'}
                        </h2>
                        {isPic && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-800 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span>PIC: {SERVICES.find(s => s.code === (user?.pic_service_code || activeService))?.name || 'Layanan'}</span>
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {user?.role === 'User'
                            ? 'Pantau perkembangan dan estimasi Lead Time permohonan yang Anda ajukan.'
                            : isPic
                                ? `Permohonan masuk ke layanan Anda (${SERVICES.find(s => s.code === activeService)?.name || 'Layanan'}).`
                                : 'Manajemen antrean permohonan seluruh unit kerja internal.'}
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    {/* View toggle — available for all roles including User */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 shadow-2xs border border-slate-200/60">
                        <button
                            type="button"
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />Kanban
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <List className="w-3.5 h-3.5 mr-1.5" />Tabel
                        </button>
                    </div>

                    {(isAdmin || isPic) && (
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleExport('csv')} className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer" title="Ekspor data ke CSV">
                                <Download className="w-3.5 h-3.5 text-slate-500" /><span>CSV</span>
                            </button>
                            <button onClick={() => handleExport('excel')} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer" title="Ekspor data permohonan & riwayat status ke Excel">
                                <FileSpreadsheet className="w-3.5 h-3.5" /><span>Ekspor Excel</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                {/* Baris 1: Primary Search & Main Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Kotak Pencarian (Search Bar) - Flexible / Grow mendominasi area kiri */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari No. Tiket, Judul Permohonan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 pl-10 pr-9 text-xs border border-slate-200 rounded-xl bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer transition-colors"
                                title="Hapus pencarian"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Dropdown Layanan (Khusus Non-PIC) */}
                    {!isPic && (
                        <div className="w-full sm:w-56 md:w-64 shrink-0">
                            <CustomSelect
                                value={serviceFilter}
                                onChange={(val) => { setServiceFilter(val); setStatusFilter(''); }}
                                options={[
                                    { value: '', label: 'Semua Layanan', icon: Filter },
                                    ...SERVICES.map(svc => ({
                                        value: svc.code,
                                        label: svc.name,
                                        icon: serviceIconMap[svc.code] || Filter,
                                        iconBg: serviceThemeMap[svc.code]?.iconBg || 'bg-slate-100 text-slate-700',
                                        colorDot: serviceThemeMap[svc.code]?.colorDot,
                                    }))
                                ]}
                                placeholder="Semua Layanan"
                                className="h-10 bg-slate-50/80 hover:bg-white border-slate-200"
                                fullWidth={true}
                            />
                        </div>
                    )}

                    {/* Dropdown Status */}
                    <div className={`w-full ${isPic ? 'sm:w-64 md:w-72' : 'sm:w-48 md:w-56'} shrink-0`}>
                        <CustomSelect
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                            options={[
                                { value: '', label: showArchived ? 'Semua (Archive)' : 'Semua Status', icon: Filter },
                                ...(showArchived
                                    ? ['Selesai', 'Ditolak']
                                    : (activeService
                                        ? (SERVICE_STATUS_FLOWS[activeService] || DEFAULT_KANBAN_COLUMNS.map(c => c.key))
                                        : ['Diajukan', 'Diproses', 'Direvisi', 'Selesai', 'Ditolak'])
                                ).map(st => ({
                                    value: st,
                                    label: st,
                                    colorDot: st === 'Diajukan' ? 'bg-amber-500' :
                                             st === 'Diproses' || st === 'Terjadwalkan/Produksi Berita' ? 'bg-blue-500' :
                                             st === 'Direvisi' ? 'bg-orange-500' :
                                             st === 'Selesai' ? 'bg-emerald-500' :
                                             st === 'Ditolak' ? 'bg-rose-500' :
                                             st.includes('Approval') ? 'bg-purple-500' :
                                             st.includes('Pemeriksaan') || st.includes('Produksi') ? 'bg-sky-500' :
                                             st.includes('Publikasi') || st.includes('Tayang') ? 'bg-blue-500' : 'bg-slate-400'
                                }))
                            ]}
                            placeholder="Semua Status"
                            className="h-10 bg-slate-50/80 hover:bg-white border-slate-200"
                            fullWidth={true}
                        />
                    </div>
                </div>

                {/* Baris 2: Secondary Filters & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    {/* Sisi Kiri: Filter Waktu & Urutan */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
                        {/* Date Range Picker */}
                        <div className="inline-flex items-center justify-between sm:justify-start bg-slate-50/80 border border-slate-200 rounded-xl px-3 h-10 text-xs text-slate-700 shadow-2xs hover:border-slate-300 transition-colors w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="bg-transparent border-0 text-xs text-slate-700 focus:outline-none p-0 cursor-pointer"
                                    title="Dari tanggal"
                                />
                            </div>
                            <span className="text-slate-400 mx-2 text-[11px] font-medium select-none">s/d</span>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="bg-transparent border-0 text-xs text-slate-700 focus:outline-none p-0 cursor-pointer"
                                    title="Sampai tanggal"
                                />
                                {(dateFrom || dateTo) && (
                                    <button
                                        type="button"
                                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                                        className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 rounded-full hover:bg-rose-50 transition-colors"
                                        title="Hapus filter rentang tanggal"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Dropdown / Tombol Urutan */}
                        <button
                            type="button"
                            onClick={() => setDateSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className={`inline-flex items-center justify-center gap-2 px-3.5 h-10 border rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs w-full sm:w-auto shrink-0 ${
                                dateSort === 'asc'
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                            }`}
                            title={`Urutan: ${dateSort === 'desc' ? 'Terbaru ke Terlama' : 'Terlama ke Terbaru'}. Klik untuk beralih.`}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Urutan: {dateSort === 'desc' ? 'Terbaru' : 'Terlama'}</span>
                            {dateSort === 'desc' ? (
                                <ArrowDown className="w-3 h-3 text-slate-400 shrink-0" />
                            ) : (
                                <ArrowUp className="w-3 h-3 text-indigo-600 shrink-0" />
                            )}
                        </button>
                    </div>

                    {/* Sisi Kanan: Tombol Aksi (Lihat Archive, Reset & Refresh) */}
                    <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
                        {/* Reset Filter Button */}
                        {(dateFrom || dateTo || dateSort !== 'desc' || showArchived || statusFilter || searchTerm) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    setDateFrom('');
                                    setDateTo('');
                                    setDateSort('desc');
                                    setShowArchived(false);
                                    setStatusFilter('');
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-3 h-10 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold transition-colors cursor-pointer border border-rose-200 shadow-2xs"
                                title="Reset seluruh filter ke kondisi default"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>
                        )}

                        {/* Tombol Lihat Archive */}
                        <button
                            type="button"
                            onClick={() => setShowArchived(prev => !prev)}
                            className={`inline-flex items-center justify-center gap-2 px-3.5 h-10 border rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                showArchived
                                    ? 'bg-amber-500 border-amber-600 text-white shadow-xs ring-2 ring-amber-300/60'
                                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                            }`}
                            title={showArchived ? 'Sedang melihat permohonan yang di-archive. Klik untuk kembali ke permohonan aktif.' : 'Klik untuk melihat permohonan yang telah di-archive'}
                        >
                            {showArchived ? (
                                <ArchiveRestore className="w-3.5 h-3.5 text-white shrink-0" />
                            ) : (
                                <Archive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span>{showArchived ? 'Menampilkan Archive' : 'Lihat Archive'}</span>
                            {showArchived && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            )}
                        </button>

                        {/* Ikon Refresh */}
                        <button
                            onClick={() => loadRequests()}
                            disabled={!activeService}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors shadow-2xs shrink-0 ${
                                !activeService
                                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                    : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 text-slate-600 hover:text-green-600 cursor-pointer'
                            }`}
                            title={!activeService ? 'Pilih layanan terlebih dahulu' : 'Refresh data'}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-green-600' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Archive Notification Banner when showArchived is true */}
            {activeService && showArchived && (
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs animate-in fade-in duration-150">
                    <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="p-2 bg-amber-200/70 text-amber-800 rounded-xl shrink-0">
                            <Archive className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900">Mode Archive Aktif</p>
                            <p className="text-[11px] text-amber-800 truncate sm:whitespace-normal">
                                Menampilkan permohonan yang telah di-archive (khusus status Selesai & Ditolak). Permohonan aktif disembunyikan.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowArchived(false)}
                        className="px-3 py-1.5 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 rounded-xl font-bold text-xs transition-colors shadow-2xs cursor-pointer shrink-0"
                    >
                        Kembali ke Papan Utama
                    </button>
                </div>
            )}

            {/* Kanban / Table View */}
            {!activeService ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs min-h-[460px]">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
                        <Filter className="w-8 h-8" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">
                        Silakan Pilih Layanan Terlebih Dahulu
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                        Untuk melihat daftar dan riwayat permohonan, silakan pilih salah satu layanan melalui filter di atas atau klik salah satu layanan di bawah ini.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl text-left">
                        {SERVICES.map(svc => {
                            const IconComp = serviceIconMap[svc.code] || Filter;
                            const theme = serviceThemeMap[svc.code] || {};
                            return (
                                <button
                                    key={svc.code}
                                    type="button"
                                    onClick={() => setServiceFilter(svc.code)}
                                    className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all duration-150 cursor-pointer group text-left"
                                >
                                    <div className={`p-2.5 rounded-xl shrink-0 ${theme.iconBg || 'bg-slate-100 text-slate-700'} group-hover:scale-105 transition-transform`}>
                                        <IconComp className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate transition-colors">
                                            {svc.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            Klik untuk memuat layanan
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : viewMode === 'table' ? (
                /* TABLE VIEW — Fully Responsive with Mobile Card List & Desktop Sticky Table */
                <div className="flex-1 overflow-auto">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                        {/* Top Table Meta Bar */}
                        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-700">Daftar Permohonan</span>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-[11px]">
                                    {processedRequests.length} data
                                </span>
                                <span className="text-[11px] text-slate-400 hidden sm:inline">
                                    • 10 baris per halaman
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                                <span>Urutan Tanggal:</span>
                                <button
                                    type="button"
                                    onClick={() => setDateSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                                    className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>{dateSort === 'desc' ? 'Terbaru' : 'Terlama'}</span>
                                    <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* DESKTOP / TABLET TABLE VIEW (hidden on mobile, block on md:) */}
                        <div className="hidden md:block overflow-x-auto custom-scrollbar">
                            <table className="w-full min-w-[1020px] text-xs text-left">
                                <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200 backdrop-blur-xs">
                                    <tr>
                                        <th className="px-4 py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] w-40 min-w-[140px] whitespace-nowrap">No. Tiket</th>
                                        <th
                                            onClick={() => setDateSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                                            className="px-4 py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] cursor-pointer hover:text-indigo-600 transition-colors select-none group w-36 min-w-[130px] whitespace-nowrap"
                                            title="Klik untuk mengubah pengurutan tanggal (Terbaru / Terlama)"
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Tanggal</span>
                                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 inline" />
                                                <span className="text-[9px] font-semibold text-indigo-600">
                                                    ({dateSort === 'desc' ? 'Terbaru' : 'Terlama'})
                                                </span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] w-48 min-w-[160px]">Layanan</th>
                                        <th className="px-4 py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] min-w-[240px]">Judul Permohonan</th>
                                        <th className="px-4 py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] w-44 min-w-[150px] whitespace-nowrap">Pemohon</th>
                                        <th className="px-4 py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] w-32 min-w-[110px] whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] text-right w-48 min-w-[170px] whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                                            <p className="text-xs font-semibold text-slate-600">Memuat data permohonan...</p>
                                        </td></tr>
                                    ) : processedRequests.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                                            <p className="text-xs font-semibold text-slate-600">Tidak ada permohonan yang sesuai filter</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau reset filter tanggal.</p>
                                        </td></tr>
                                    ) : paginatedRequests.map(req => {
                                        const reqForm = (typeof req.form_data === 'string')
                                            ? (() => { try { return JSON.parse(req.form_data); } catch { return {}; } })()
                                            : (req.form_data || {});
                                        const rawTargetDate = reqForm.tanggal_kegiatan || reqForm.tanggal_dibutuhkan || req.tanggal_dibutuhkan || reqForm.deadline || reqForm.tanggal_publikasi || reqForm.tanggal_produksi;
                                        const targetDate = formatShortDate(rawTargetDate);
                                        return (
                                            <tr
                                                key={req.id}
                                                className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                                                onClick={() => openDetail(req.id)}
                                                title="Klik untuk melihat detail lengkap permohonan"
                                            >
                                                <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                                                    <span className="font-mono font-bold text-indigo-700 text-[11px] bg-indigo-50/80 border border-indigo-200/80 px-2.5 py-1 rounded-lg shadow-2xs whitespace-nowrap inline-block group-hover:bg-indigo-100/80 transition-colors">
                                                        {req.nomor_tiket}
                                                    </span>
                                                    {req.is_archived && (
                                                        <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200 mt-1 block w-fit">
                                                            <Archive className="w-2.5 h-2.5 inline" />
                                                            <span>Archive</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap align-middle">
                                                    <span className="font-semibold text-slate-800 text-xs block">
                                                        {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    {targetDate && (
                                                        <span className="inline-flex items-center text-[10px] text-amber-800 font-semibold bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md mt-1">
                                                            Target: {targetDate}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <span className="font-bold text-slate-800 text-xs block leading-tight">
                                                        {getFullServiceName(req)}
                                                    </span>
                                                    {reqForm.kategori_kegiatan && (
                                                        <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded font-semibold inline-block mt-1">
                                                            {reqForm.kategori_kegiatan}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 align-middle max-w-sm">
                                                    <span className="font-bold text-slate-900 line-clamp-1 text-xs group-hover:text-indigo-600 transition-colors leading-snug">
                                                        {req.judul_permohonan}
                                                    </span>
                                                    {reqForm.nama_kegiatan && reqForm.nama_kegiatan !== req.judul_permohonan && (
                                                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                                                            Acara: {reqForm.nama_kegiatan}
                                                        </span>
                                                    )}
                                                    {Array.isArray(reqForm.souvenir_items) && reqForm.souvenir_items.length > 0 && (
                                                        <span className="text-[10px] text-amber-800 font-semibold block truncate mt-0.5">
                                                            Suvenir: {reqForm.souvenir_items.map(s => `${s.nama_item} (${s.qty})`).join(', ')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {(reqForm.nama_pemohon || req.user?.name)?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-bold text-slate-800 block text-xs leading-tight truncate">
                                                                {reqForm.nama_pemohon || req.requested_for?.name || req.user?.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                                                                {reqForm.unit_pemohon || req.requested_for?.unit_kerja || req.user?.unit_kerja}
                                                            </span>
                                                            {(req.requested_for || reqForm.requested_for_name) && (
                                                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                    Mewakili (via {req.user?.name})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusBadgeStyles[req.status] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap align-middle">
                                                    <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                                        {['Selesai', 'Ditolak'].includes(req.status) && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleToggleArchive(req, e)}
                                                                disabled={archivingId === req.id}
                                                                className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 shadow-2xs whitespace-nowrap ${
                                                                    req.is_archived
                                                                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                                                                        : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-indigo-600 border-slate-200'
                                                                } ${archivingId === req.id ? 'opacity-40 cursor-wait' : ''}`}
                                                                title={req.is_archived ? "Batal Archive (Kembalikan ke Papan Utama)" : "Archive permohonan ini"}
                                                            >
                                                                {req.is_archived ? <ArchiveRestore className="w-3 h-3 text-amber-700" /> : <Archive className="w-3 h-3 text-slate-500" />}
                                                                <span>{req.is_archived ? 'Batal Archive' : 'Archive'}</span>
                                                            </button>
                                                        )}
                                                        {canUpdateStatus && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openUpdateModalForReq(req)}
                                                                className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                                                                title="Ubah status permohonan ini"
                                                            >
                                                                Ubah Status
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => openDetail(req.id)}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Lihat detail permohonan"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARD VIEW (block on mobile, hidden on md:) */}
                        <div className="block md:hidden bg-slate-50/50 p-3 space-y-3">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                                    <p className="text-xs font-semibold text-slate-600">Memuat data permohonan...</p>
                                </div>
                            ) : processedRequests.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                                    <p className="text-xs font-semibold text-slate-600">Tidak ada permohonan yang sesuai filter</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau reset filter tanggal.</p>
                                </div>
                            ) : (
                                paginatedRequests.map(req => {
                                    const reqForm = (typeof req.form_data === 'string')
                                        ? (() => { try { return JSON.parse(req.form_data); } catch { return {}; } })()
                                        : (req.form_data || {});
                                    const rawTargetDate = reqForm.tanggal_kegiatan || reqForm.tanggal_dibutuhkan || req.tanggal_dibutuhkan || reqForm.deadline || reqForm.tanggal_publikasi || reqForm.tanggal_produksi;
                                    const targetDate = formatShortDate(rawTargetDate);
                                    const createdDate = new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

                                    return (
                                        <div
                                            key={req.id}
                                            onClick={() => openDetail(req.id)}
                                            className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-indigo-300 transition-all p-3.5 space-y-2.5 active:bg-slate-50 cursor-pointer"
                                        >
                                            {/* Top Row: Ticket & Status */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg text-xs">
                                                    {req.nomor_tiket}
                                                </span>
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusBadgeStyles[req.status] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                                    {req.status}
                                                </span>
                                            </div>

                                            {/* Title & Service */}
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                                                    {req.judul_permohonan}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                    <span className="text-[11px] font-bold text-slate-700">
                                                        {getFullServiceName(req)}
                                                    </span>
                                                    {reqForm.kategori_kegiatan && (
                                                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md font-semibold">
                                                            {reqForm.kategori_kegiatan}
                                                        </span>
                                                    )}
                                                </div>
                                                {reqForm.nama_kegiatan && reqForm.nama_kegiatan !== req.judul_permohonan && (
                                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                        Acara: {reqForm.nama_kegiatan}
                                                    </p>
                                                )}
                                                {Array.isArray(reqForm.souvenir_items) && reqForm.souvenir_items.length > 0 && (
                                                    <p className="text-[11px] text-amber-700 font-medium truncate mt-0.5">
                                                        Suvenir: {reqForm.souvenir_items.map(s => `${s.nama_item} (${s.qty})`).join(', ')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Meta: Pemohon & Tanggal */}
                                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Pemohon</span>
                                                    <span className="font-bold text-slate-800 truncate block">
                                                        {reqForm.nama_pemohon || req.requested_for?.name || req.user?.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 truncate block">
                                                        {reqForm.unit_pemohon || req.requested_for?.unit_kerja || req.user?.unit_kerja}
                                                    </span>
                                                    {(req.requested_for || reqForm.requested_for_name) && (
                                                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                            Mewakili (via {req.user?.name})
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Tanggal</span>
                                                    <span className="text-slate-700 block font-medium">
                                                        {createdDate}
                                                    </span>
                                                    {targetDate && (
                                                        <span className="text-[10px] text-amber-700 font-semibold block truncate">
                                                            Target: {targetDate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    Ketuk untuk detail lengkap
                                                </span>
                                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    {['Selesai', 'Ditolak'].includes(req.status) && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleToggleArchive(req, e)}
                                                            disabled={archivingId === req.id}
                                                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 shadow-2xs whitespace-nowrap ${
                                                                req.is_archived
                                                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                                                                    : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-indigo-600 border-slate-200'
                                                            } ${archivingId === req.id ? 'opacity-40 cursor-wait' : ''}`}
                                                            title={req.is_archived ? "Batal Archive (Kembalikan ke Papan Utama)" : "Archive permohonan ini"}
                                                        >
                                                            {req.is_archived ? <ArchiveRestore className="w-3 h-3 text-amber-700" /> : <Archive className="w-3 h-3 text-slate-500" />}
                                                            <span>{req.is_archived ? 'Batal Archive' : 'Archive'}</span>
                                                        </button>
                                                    )}
                                                    {canUpdateStatus && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openUpdateModalForReq(req)}
                                                            className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                                                        >
                                                            Ubah Status
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => openDetail(req.id)}
                                                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        <span>Detail</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* PAGINATION CONTROLS (10 BARIS PER HALAMAN) */}
                        {processedRequests.length > 0 && (
                            <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                {/* Status jumlah & range data */}
                                <div className="text-slate-500 text-[11px] sm:text-xs text-center sm:text-left">
                                    Menampilkan <span className="font-bold text-slate-800">{startIndex}</span> - <span className="font-bold text-slate-800">{endIndex}</span> dari <span className="font-bold text-indigo-700">{totalItems}</span> permohonan
                                    <span className="text-slate-400 ml-1.5 hidden sm:inline">(Halaman {safeCurrentPage} dari {totalPages})</span>
                                </div>

                                {/* Tombol Navigasi Halaman */}
                                <div className="flex items-center space-x-1 sm:space-x-1.5 flex-wrap justify-center">
                                    {/* Tombol Halaman Pertama */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={safeCurrentPage === 1}
                                        className="p-1.5 sm:p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all cursor-pointer shadow-2xs"
                                        title="Halaman Pertama"
                                    >
                                        <ChevronsLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>

                                    {/* Tombol Sebelumnya */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={safeCurrentPage === 1}
                                        className="px-2.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold shadow-2xs"
                                        title="Halaman Sebelumnya"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Sebelumnya</span>
                                    </button>

                                    {/* Nomor Halaman */}
                                    <div className="flex items-center space-x-1">
                                        {pageNumbers.map((p, idx) => {
                                            if (p === '...') {
                                                return (
                                                    <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-slate-400 font-bold select-none text-xs">
                                                        …
                                                    </span>
                                                );
                                            }
                                            const isActive = p === safeCurrentPage;
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                                        isActive
                                                            ? 'bg-indigo-600 text-white shadow-xs scale-105'
                                                            : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Tombol Berikutnya */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={safeCurrentPage === totalPages}
                                        className="px-2.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold shadow-2xs"
                                        title="Halaman Berikutnya"
                                    >
                                        <span className="hidden sm:inline">Berikutnya</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Tombol Halaman Terakhir */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={safeCurrentPage === totalPages}
                                        className="p-1.5 sm:p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all cursor-pointer shadow-2xs"
                                        title="Halaman Terakhir"
                                    >
                                        <ChevronsRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Footer Tips */}
                        <div className="px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-400 text-center font-medium bg-slate-50/50">
                            <span className="hidden md:inline">💡 Tips: Klik pada baris tabel mana saja untuk memunculkan detail lengkap permohonan.</span>
                            <span className="inline md:hidden">💡 Tips: Ketuk kartu permohonan untuk melihat detail lengkap.</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* KANBAN VIEW */
                <div
                    ref={scrollRef}
                    onDragOver={canDrag ? handleBoardDragOver : undefined}
                    onDragLeave={() => {
                        if (scrollAnimRef.current) { cancelAnimationFrame(scrollAnimRef.current); scrollAnimRef.current = null; }
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
                            {activeKanbanColumns.map(column => {
                                const items = groupedRequests[column.key] || [];
                                const isDropTarget = canDrag && dragOverColumn === column.key && draggedItem?.status !== column.key;
                                return (
                                    <div
                                        key={column.key}
                                        onDragOver={canDrag ? (e) => handleDragOver(e, column.key) : undefined}
                                        onDragLeave={canDrag ? handleDragLeave : undefined}
                                        onDrop={canDrag ? (e) => handleDrop(e, column.key) : undefined}
                                        className={`w-[280px] flex-shrink-0 flex flex-col bg-slate-50/80 rounded-2xl border transition-all duration-150 ${isDropTarget
                                            ? `${column.borderColor} border-2 ring-2 ring-offset-1 ring-${column.color}-400 shadow-lg`
                                            : 'border-slate-200'
                                            }`}
                                    >
                                        {/* Column Header */}
                                        <div className={`${column.headerBg} px-4 py-3 rounded-t-2xl border-b ${column.borderColor} flex items-center justify-between`}>
                                            <h3 className={`text-xs font-bold ${column.textColor}`}>{column.label}</h3>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${column.bgCard} ${column.textColor} border ${column.borderColor}`}>
                                                {items.length}
                                            </span>
                                        </div>

                                        {/* Column Body */}
                                        <div className={`flex-1 p-2.5 space-y-2.5 overflow-y-auto custom-scrollbar max-h-[calc(100vh-320px)] rounded-b-2xl transition-colors duration-150 ${isDropTarget ? `${column.bgCard} bg-opacity-60` : ''}`}>
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
                                                        isDraggable={canDrag}
                                                        onDragStart={handleDragStart}
                                                        onDragEnd={handleDragEnd}
                                                        onToggleArchive={handleToggleArchive}
                                                        isArchiving={archivingId === req.id}
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
            )}

            {/* Loading Detail Overlay */}
            {loadingDetail && (
                <div className="fixed inset-0 z-50 bg-slate-900/30 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 shadow-xl">
                        <RefreshCw className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-600 font-medium">Memuat detail...</p>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedDetail && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 p-6 sm:px-8 pb-4 shrink-0 bg-white">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-mono text-sm font-black text-indigo-700">{selectedDetail.nomor_tiket}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusBadgeStyles[selectedDetail.status] || ''}`}>
                                        {selectedDetail.status}
                                    </span>
                                    {selectedDetail.is_archived && (
                                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold">
                                            <Archive className="w-3 h-3 text-amber-700" />
                                            <span>Archived</span>
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-base font-extrabold text-slate-900">{selectedDetail.judul_permohonan}</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Diajukan oleh: <strong>{selectedDetail.user?.name}</strong> ({selectedDetail.user?.unit_kerja})
                                </p>
                            </div>
                            <button onClick={() => setSelectedDetail(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            {/* Form-specific detail */}
                            <RequestFormDetail
                                detail={selectedDetail}
                                user={user}
                                onRefresh={() => {
                                    loadRequests();
                                    if (selectedDetail?.id) {
                                        openDetail(selectedDetail.id);
                                    }
                                }}
                            />

                            {/* Attachments (Hanya berkas awal pemohon, hasil revisi otomatis masuk ke timeline) */}
                            {(() => {
                                const initialAttachments = selectedDetail.attachments?.filter(att => !att.file_name?.startsWith('[Hasil Revisi')) || [];
                                if (initialAttachments.length === 0) return null;
                                return (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lampiran Berkas Pemohon</h4>
                                        <div className="space-y-1.5">
                                            {initialAttachments.map(att => (
                                                <a
                                                    key={att.id}
                                                    href={att.download_url || `/api/v1/attachments/${att.id}/download`}
                                                    download={att.clean_file_name || att.file_name}
                                                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl text-xs text-indigo-700 font-medium transition-colors group/item"
                                                    title={`Unduh: ${att.clean_file_name || att.file_name}`}
                                                >
                                                    <div className="flex items-center space-x-2 truncate">
                                                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate font-semibold">{att.clean_file_name || att.file_name}</span>
                                                        <span className="text-[10px] text-slate-400">({(att.file_size / 1024).toFixed(0)} KB)</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-slate-400 group-hover/item:text-indigo-600 shrink-0">
                                                        <span className="text-[10px] font-bold">Unduh</span>
                                                        <Download className="w-3.5 h-3.5" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Status Timeline */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Riwayat Status Kronologis</h4>
                                    {(isAdmin || isPic) && (
                                        <button
                                            type="button"
                                            onClick={() => window.open(`/api/v1/export/excel?search=${selectedDetail.nomor_tiket}`, '_blank')}
                                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                                            title="Ekspor data dan riwayat status tiket ini ke Excel"
                                        >
                                            <FileSpreadsheet className="w-3.5 h-3.5" />
                                            <span>Ekspor Tiket ke Excel</span>
                                        </button>
                                    )}
                                </div>
                                <StatusTimeline histories={selectedDetail.status_histories} />
                            </div>

                            {/* Status Update / Archive Action */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-slate-500">
                                        {isPic ? 'Aksi PIC:' : 'Aksi Admin / Pemohon:'}
                                    </span>
                                    {['Selesai', 'Ditolak'].includes(selectedDetail.status) && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleArchive(selectedDetail)}
                                            disabled={archivingId === selectedDetail.id}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs hover:scale-105 active:scale-95 ${
                                                selectedDetail.is_archived
                                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                            } ${archivingId === selectedDetail.id ? 'opacity-40 cursor-wait' : ''}`}
                                            title={selectedDetail.is_archived ? "Batal Archive (Kembalikan ke Papan Utama)" : "Archive permohonan"}
                                        >
                                            {selectedDetail.is_archived ? <ArchiveRestore className="w-3.5 h-3.5 text-amber-700" /> : <Archive className="w-3.5 h-3.5 text-slate-500" />}
                                            <span>{selectedDetail.is_archived ? 'Batal Archive' : 'Archive'}</span>
                                        </button>
                                    )}
                                </div>
                                {canUpdateStatus && (
                                    <button
                                        onClick={() => setUpdateModalOpen(true)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                                    >
                                        Ubah Status
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {updateModalOpen && (
                <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <h4 className="font-bold text-slate-900 text-sm">Perbarui Status Permohonan</h4>
                            <button onClick={() => { setUpdateModalOpen(false); setRevisionFiles([]); }} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {statusError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-4 flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{statusError}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Status Baru</label>
                                <CustomSelect
                                    value={targetStatus}
                                    onChange={(val) => setTargetStatus(val)}
                                    options={getStatusOptions().map(s => ({
                                        value: s,
                                        label: s,
                                        colorDot: s === 'Diajukan' ? 'bg-amber-500' :
                                                 (s === 'Diproses' || s === 'Terjadwalkan/Produksi Berita') ? 'bg-blue-500' :
                                                 s === 'Direvisi' ? 'bg-orange-500' :
                                                 s === 'Selesai' ? 'bg-emerald-500' :
                                                 s.includes('Approval') ? 'bg-purple-500' :
                                                 s.includes('Pemeriksaan') || s.includes('Produksi') ? 'bg-sky-500' :
                                                 s.includes('Publikasi') || s.includes('Tayang') ? 'bg-blue-500' : 'bg-rose-500'
                                    }))}
                                    placeholder="Pilih Status"
                                    className="w-full bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Catatan / Alasan{' '}
                                    {(isPic || ['Ditolak', 'Direvisi'].includes(targetStatus))
                                        ? <span className="text-rose-500">* (Wajib)</span>
                                        : <span className="text-slate-400">(Opsional)</span>
                                    }
                                </label>
                                <textarea
                                    rows={3}
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    placeholder={
                                        targetStatus === 'Ditolak' ? 'Sebutkan alasan penolakan agar pemohon mengetahui penyebabnya...' :
                                            targetStatus === 'Direvisi' ? 'Sebutkan dokumen atau perubahan yang perlu dilengkapi pemohon...' :
                                                isPic ? 'Berikan catatan proses wajib untuk pemohon...' :
                                                    'Berikan catatan proses...'
                                    }
                                    className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white"
                                    required={isPic || ['Ditolak', 'Direvisi'].includes(targetStatus)}
                                />
                            </div>

                            {/* Unggah Berkas/Foto Hasil Revisi (Tahap Pemeriksaan / Revisi) - Mendukung Multiple Attachments */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-700">
                                        Unggah Berkas / Foto Hasil Revisi (Opsional)
                                    </label>
                                    {revisionFiles.length > 0 && (
                                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                            {revisionFiles.length} Berkas Dipilih
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                                    onChange={handleRevisionFilesChange}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                />
                                {revisionFiles.length > 0 ? (
                                    <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                        {revisionFiles.map((file, idx) => (
                                            <div key={idx} className="p-2 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between text-[11px] text-indigo-900">
                                                <div className="flex items-center space-x-2 min-w-0 mr-2">
                                                    <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                    <span className="font-mono font-bold truncate">[Hasil Revisi] {file.name}</span>
                                                    <span className="text-[10px] text-indigo-500 font-semibold shrink-0">
                                                        ({(file.size / 1024).toFixed(0)} KB)
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRevisionFile(idx)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                                                    title="Hapus berkas ini"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Bisa memilih lebih dari satu berkas (Multiple Attachments). Format: PDF, JPG, PNG, DOCX (Maks 10MB per berkas). Berkas hasil revisi akan otomatis menempel di Riwayat Status Kronologis pada tahapan ini.
                                    </p>
                                )}
                            </div>

                            {/* Tip Alur Desain Grafis */}
                            {selectedDetail?.service?.code === 'D' && (
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                                    💡 <strong>Persetujuan Desain:</strong> Persetujuan akhir dapat dilakukan di luar sistem (misal WhatsApp/Email review). PIC cukup menandai status <strong>'Selesai'</strong> di sistem ini setelah pemohon menyetujui.
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUpdateModalOpen(false);
                                        setRevisionFiles([]);
                                    }}
                                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingStatus}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                                >
                                    {submittingStatus ? 'Menyimpan...' : 'Simpan Status'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Archive / Batal Archive Confirmation Modal */}
            {archiveConfirmModal.isOpen && archiveConfirmModal.req && (
                <div className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        {/* Top decorative header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-3 rounded-2xl flex items-center justify-center shadow-xs ${
                                    archiveConfirmModal.willArchive
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}>
                                    {archiveConfirmModal.willArchive ? (
                                        <Archive className="w-6 h-6" />
                                    ) : (
                                        <ArchiveRestore className="w-6 h-6" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                                        {archiveConfirmModal.willArchive ? 'Archive Permohonan' : 'Batal Archive Permohonan'}
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Konfirmasi status archive</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setArchiveConfirmModal({ isOpen: false, req: null, willArchive: true })}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Request Card Context */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl mb-4 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-100">
                                    {archiveConfirmModal.req.nomor_tiket}
                                </span>
                                <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusBadgeStyles[archiveConfirmModal.req.status] || 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                                    {archiveConfirmModal.req.status}
                                </span>
                            </div>
                            <h5 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                                {archiveConfirmModal.req.judul_permohonan}
                            </h5>
                            <p className="text-[11px] text-slate-500 truncate">
                                Layanan: <strong>{getFullServiceName(archiveConfirmModal.req)}</strong>
                            </p>
                        </div>

                        {/* Explanatory Message */}
                        <p className="text-xs text-slate-600 leading-relaxed mb-6">
                            {archiveConfirmModal.willArchive
                                ? 'Permohonan akan dipindahkan ke daftar Archive agar papan utama tetap rapi dan fokus pada permohonan yang aktif. Anda dapat melihat atau mengembalikannya kapan saja melalui filter Archive.'
                                : 'Kembalikan permohonan ini dari daftar Archive ke papan utama?'
                            }
                        </p>

                        {/* Modal Footer Actions */}
                        <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setArchiveConfirmModal({ isOpen: false, req: null, willArchive: true })}
                                disabled={archivingId === archiveConfirmModal.req.id}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmArchive}
                                disabled={archivingId === archiveConfirmModal.req.id}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center space-x-2 cursor-pointer ${
                                    archiveConfirmModal.willArchive
                                        ? 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                                        : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                                } ${archivingId === archiveConfirmModal.req.id ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {archivingId === archiveConfirmModal.req.id ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : archiveConfirmModal.willArchive ? (
                                    <>
                                        <Archive className="w-3.5 h-3.5" />
                                        <span>Ya, Archive</span>
                                    </>
                                ) : (
                                    <>
                                        <ArchiveRestore className="w-3.5 h-3.5" />
                                        <span>Ya, Batal Archive</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

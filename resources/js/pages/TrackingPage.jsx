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
    GripVertical,
    List,
    LayoutGrid,
    AlertCircle,
    ChevronRight,
    Video,
    Gift,
    Megaphone,
    Palette,
    Camera
} from 'lucide-react';

// --- Service definitions ---
const SERVICES = [
    { code: 'D', name: 'Layanan Desain Grafis', color: 'indigo' },
    { code: 'P', name: 'Layanan Publikasi Website & Social Media', color: 'sky' },
    { code: 'S', name: 'Layanan Permohonan Alat Promosi', color: 'amber' },
    { code: 'M', name: 'Layanan Multimedia, Dokumentasi, & Live Streaming', color: 'emerald' },
    { code: 'L', name: 'Layanan Liputan & Berita', color: 'rose' },
];

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
    P: ['Diajukan', 'Pemeriksaan Konten', 'Publikasi', 'Selesai', 'Ditolak'],
    S: ['Diajukan', 'Diproses', 'Menunggu Approval Sebagian', 'Selesai', 'Ditolak'],
    M: ['Diajukan', 'Diproses', 'Selesai', 'Ditolak'],
    L: ['Diajukan', 'Diproses', 'Selesai', 'Ditolak'],
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
        { key: 'Pemeriksaan Konten', label: 'Pemeriksaan Konten', color: 'sky', bgCard: 'bg-sky-50', borderColor: 'border-sky-200', headerBg: 'bg-sky-100', textColor: 'text-sky-800' },
        { key: 'Publikasi', label: 'Publikasi', color: 'blue', bgCard: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100', textColor: 'text-blue-800' },
        { key: 'Selesai', label: 'Selesai', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
        { key: 'Ditolak', label: 'Ditolak', color: 'rose', bgCard: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-rose-100', textColor: 'text-rose-800' },
    ],
    S: [
        { key: 'Diajukan', label: 'Diajukan', color: 'amber', bgCard: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-amber-100', textColor: 'text-amber-800' },
        { key: 'Diproses', label: 'Diproses', color: 'blue', bgCard: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100', textColor: 'text-blue-800' },
        { key: 'Menunggu Approval Sebagian', label: 'Menunggu Approval', color: 'purple', bgCard: 'bg-purple-50', borderColor: 'border-purple-200', headerBg: 'bg-purple-100', textColor: 'text-purple-800' },
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
        { key: 'Diproses', label: 'Diproses', color: 'blue', bgCard: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100', textColor: 'text-blue-800' },
        { key: 'Selesai', label: 'Selesai', color: 'emerald', bgCard: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
        { key: 'Ditolak', label: 'Ditolak', color: 'rose', bgCard: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-rose-100', textColor: 'text-rose-800' },
    ],
};

const statusBadgeStyles = {
    'Diajukan': 'bg-amber-50 text-amber-800 border-amber-200',
    'Diproses': 'bg-blue-50 text-blue-800 border-blue-200',
    'Direvisi': 'bg-orange-50 text-orange-800 border-orange-200',
    'Pemeriksaan Konten': 'bg-sky-50 text-sky-800 border-sky-200',
    'Publikasi': 'bg-blue-50 text-blue-800 border-blue-200',
    'Menunggu Approval Sebagian': 'bg-purple-50 text-purple-800 border-purple-200',
    'Selesai': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Ditolak': 'bg-rose-50 text-rose-800 border-rose-200',
};

function KanbanCard({ req, column, onOpenDetail, isDraggable, onDragStart, onDragEnd }) {
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
                <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                    {req.nomor_tiket}
                </span>
                <span className="text-[10px] text-slate-400">
                    {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </span>
            </div>

            <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 mb-2">
                {req.judul_permohonan}
            </h4>

            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 mb-2">
                {req.service?.name || req.kategori}
            </span>

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
function RequestFormDetail({ detail }) {
    if (!detail) return null;
    const serviceCode = detail.service?.code || (detail.kategori === 'Desain' ? 'D' : detail.kategori === 'Publikasi' ? 'P' : detail.kategori === 'Suvenir' ? 'S' : detail.kategori === 'Multimedia' ? 'M' : detail.kategori === 'Liputan' ? 'L' : null);

    const formData = (typeof detail.form_data === 'string')
        ? (() => { try { return JSON.parse(detail.form_data); } catch { return {}; } })()
        : (detail.form_data || {});

    return (
        <div className="space-y-4">
            {/* Common default fields: No. Tiket, Tanggal, Jam, Layanan, Judul, Pemohon, Status */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Informasi Utama Permohonan</p>
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
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Status</p>
                        <div className="mt-0.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusBadgeStyles[detail.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                {detail.status}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Tanggal Pengajuan</p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                            {new Date(detail.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Jam Pengajuan</p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                            {new Date(detail.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Pemohon</p>
                        <p className="font-semibold text-slate-800 mt-0.5">
                            {detail.user?.name}
                            <span className="block text-[10px] text-slate-400 font-normal">{detail.user?.unit_kerja || 'Unit Kerja YARSI'}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Judul & Deskripsi Kebutuhan */}
            <div className="space-y-2">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Judul Permohonan</p>
                    <p className="text-sm font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">{detail.judul_permohonan}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deskripsi / Spesifikasi Kebutuhan</p>
                    <p className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                        {detail.deskripsi_kebutuhan}
                    </p>
                </div>
            </div>

            {/* Rincian Spesifik Sesuai Formulir Masing-Masing Layanan */}
            {/* 1. Layanan Multimedia (M) */}
            {serviceCode === 'M' && (
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-emerald-950 flex items-center space-x-1.5 text-xs">
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
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Produksi / Pelaksanaan</span>
                            <span className="font-bold text-slate-900">
                                {detail.multimedia_detail?.tanggal_pelaksanaan || formData?.tanggal_produksi || detail.tanggal_dibutuhkan || '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Operasional / Jam</span>
                            <span className="font-bold text-slate-900">
                                {detail.multimedia_detail ? `${detail.multimedia_detail.jam_mulai?.slice(0, 5)} - ${detail.multimedia_detail.jam_selesai?.slice(0, 5)} WIB (${formatDurasi(detail.multimedia_detail.durasi_menit)})` : (formData?.jam_mulai ? `${formData.jam_mulai} - ${formData.jam_selesai} WIB` : '-')}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Ruangan / Lokasi Alat</span>
                            <span className="font-bold text-slate-900">
                                {detail.multimedia_detail?.lokasi_alat || formData?.lokasi_produksi || 'Studio Podcast'}
                            </span>
                        </div>
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
                        {formData?.nama_pic_kegiatan && (
                            <div className="sm:col-span-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                PIC Lapangan: <strong>{formData.nama_pic_kegiatan}</strong> (WA: {formData.no_whatsapp_pic || '-'})
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 2. Layanan Permohonan Alat Promosi / Suvenir (S) */}
            {serviceCode === 'S' && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-amber-950 flex items-center space-x-1.5 text-xs">
                            <Gift className="w-4 h-4 text-amber-600" />
                            <span>Rincian Pengajuan Alat Promosi & Suvenir</span>
                        </h4>
                        {formData?.kategori_kegiatan && (
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black">
                                Kategori: {formData.kategori_kegiatan}
                            </span>
                        )}
                    </div>

                    {/* Tabel Daftar Souvenir yang Diajukan */}
                    {Array.isArray(formData?.souvenir_items) && formData.souvenir_items.length > 0 ? (
                        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                            <div className="px-3 py-2 bg-amber-100/60 font-bold text-[11px] text-amber-900 flex justify-between">
                                <span>Daftar Item Suvenir yang Diajukan</span>
                                <span>Jumlah</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {formData.souvenir_items.map((it, idx) => (
                                    <div key={idx} className="px-3 py-2 flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-800">{it.nama_item}</span>
                                        <span className="font-mono font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                            {it.qty} unit
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        detail.suvenir_detail && (
                            <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Item Suvenir</span>
                                    <span className="font-black text-slate-900 text-sm">{detail.suvenir_detail.nama_item || 'Suvenir Kampus'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Status Otorisasi</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${detail.suvenir_detail.status_approval === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            detail.suvenir_detail.status_approval === 'Disetujui Sebagian' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                detail.suvenir_detail.status_approval === 'Ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    'bg-purple-50 text-purple-700 border-purple-200'
                                        }`}>
                                        {detail.suvenir_detail.status_approval}
                                    </span>
                                </div>
                            </div>
                        )
                    )}

                    {/* Kuota Approval Breakdown */}
                    {detail.suvenir_detail && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Diminta</p>
                                <p className="text-base font-black text-slate-900 mt-0.5">{detail.suvenir_detail.qty_diminta} unit</p>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                                <p className="text-[10px] text-emerald-600 font-bold uppercase">Disetujui</p>
                                <p className="text-base font-black text-emerald-700 mt-0.5">{detail.suvenir_detail.qty_disetujui_otomatis} unit</p>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-amber-300">
                                <p className="text-[10px] text-amber-700 font-bold uppercase">Perlu Kuota</p>
                                <p className="text-base font-black text-amber-700 mt-0.5">{detail.suvenir_detail.qty_perlu_approval} unit</p>
                            </div>
                        </div>
                    )}

                    {detail.suvenir_detail?.catatan_approver && (
                        <div className="p-3 bg-white rounded-xl border border-amber-200 text-[11px] text-slate-700">
                            <span className="font-bold text-amber-900 block mb-0.5">Catatan Persetujuan PIC / Approver:</span>
                            <span>{detail.suvenir_detail.catatan_approver}</span>
                        </div>
                    )}
                </div>
            )}

            {/* 3. Layanan Publikasi Website & Social Media (P) */}
            {serviceCode === 'P' && (
                <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-sky-950 flex items-center space-x-1.5 text-xs">
                            <Megaphone className="w-4 h-4 text-sky-600" />
                            <span>Rincian Pengajuan Publikasi Medsos & Website</span>
                        </h4>
                        {formData?.tanggal_publikasi && (
                            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[10px] font-black">
                                Target Tayang: {formData.tanggal_publikasi}
                            </span>
                        )}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-sky-100 space-y-2.5 text-slate-700">
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
                                    <span className="text-slate-400 block font-bold uppercase text-[10px]">Link Google Drive:</span>
                                    <a href={formData.link_drive} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline truncate block">
                                        {formData.link_drive}
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="p-2.5 bg-sky-50/60 rounded-lg text-[11px] text-sky-900 border border-sky-100">
                            ℹ️ <strong>Alur Penanganan Publikasi:</strong> Diajukan ➔ Pemeriksaan Konten ➔ Publikasi ➔ Selesai
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Layanan Desain Grafis (D) */}
            {serviceCode === 'D' && (
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-indigo-950 flex items-center space-x-1.5 text-xs">
                            <Palette className="w-4 h-4 text-indigo-600" />
                            <span>Rincian Pengajuan Desain Grafis</span>
                        </h4>
                        {formData?.deadline && (
                            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black">
                                Deadline: {formData.deadline}
                            </span>
                        )}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-3 text-slate-700">
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

                        <div className="p-2.5 bg-indigo-50/60 rounded-lg text-[11px] text-indigo-900 leading-relaxed border border-indigo-100">
                            ℹ️ <strong>Alur Penanganan Desain:</strong> Diajukan ➔ Diproses ➔ Direvisi ➔ Selesai. Persetujuan akhir dilakukan di luar sistem (misal WhatsApp/Email review), dan PIC cukup menandai status <strong>'Selesai'</strong> di sistem ini.
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Layanan Liputan & Berita (L) */}
            {serviceCode === 'L' && (
                <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-rose-950 flex items-center space-x-1.5 text-xs">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Peliputan</span>
                                <span className="font-bold text-slate-900">
                                    {formData?.waktu_peliputan || detail.tanggal_dibutuhkan || '-'}
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

                        <p className="text-[11px] text-slate-600">
                            <strong>Alur Penanganan:</strong> Diajukan ➔ Diproses (Penugasan Fotografer/Jurnalis) ➔ Selesai (Penyerahan Dokumentasi & Berita)
                        </p>
                    </div>
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

    // Filter states
    const isPic = user?.role === 'PIC';
    const picServiceCode = isPic ? user?.pic_service_code : null;
    const [serviceFilter, setServiceFilter] = useState(picServiceCode || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Active service: for PIC it is strictly locked to user.pic_service_code
    const activeService = isPic ? (user?.pic_service_code || '') : serviceFilter;

    // Detail modal states
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Status update modal
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [targetStatus, setTargetStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [revisionFile, setRevisionFile] = useState(null);
    const [submittingStatus, setSubmittingStatus] = useState(false);
    const [statusError, setStatusError] = useState(null);

    // Drag-and-drop (admin/superadmin/PIC)
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [dragUpdating, setDragUpdating] = useState(false);

    const scrollRef = useRef(null);
    const scrollAnimRef = useRef(null);

    const isAdmin = ['Admin', 'SuperAdmin'].includes(user?.role);
    const canDrag = isAdmin || isPic;
    const canUpdateStatus = isAdmin || isPic;

    // Get service-specific kanban columns
    const activeKanbanColumns = activeService
        ? (SERVICE_KANBAN[activeService] || DEFAULT_KANBAN_COLUMNS)
        : DEFAULT_KANBAN_COLUMNS;

    // Get available status options for update modal based on service
    const getStatusOptions = (customServiceCode = null) => {
        const code = customServiceCode || selectedDetail?.service?.code || activeService;
        const flow = SERVICE_STATUS_FLOWS[code] || ['Diajukan', 'Diproses', 'Direvisi', 'Selesai', 'Ditolak'];
        return flow.filter(s => s !== 'Diajukan');
    };

    const loadRequests = async () => {
        if (!activeService && user?.role !== 'User') {
            setRequests([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('per_page', '100');
            if (activeService) params.append('service_code', activeService);
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
        if (isPic && user?.pic_service_code && serviceFilter !== user.pic_service_code) {
            setServiceFilter(user.pic_service_code);
        }
    }, [user, isPic]);

    useEffect(() => {
        loadRequests();
    }, [activeService, searchTerm, user]);

    const openDetail = async (id) => {
        setLoadingDetail(true);
        setRevisionFile(null);
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
        setRevisionFile(null);
        setSelectedDetail(req);
        const reqServiceCode = req.service?.code || activeService;
        const flow = SERVICE_STATUS_FLOWS[reqServiceCode] || ['Diajukan', 'Diproses', 'Direvisi', 'Selesai', 'Ditolak'];
        const currentIdx = flow.indexOf(req.status);
        const nextStatus = flow[currentIdx + 1] || flow[flow.length - 2] || 'Diproses';
        setTargetStatus(nextStatus);
        setUpdateModalOpen(true);
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
            if (revisionFile) {
                formData.append('revision_file', revisionFile);
            }

            const res = await api.post(`/requests/${selectedDetail.id}/status`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.status === 'success') {
                setRequests(prev => prev.map(r => r.id === selectedDetail.id ? { ...r, status: targetStatus } : r));
                setSelectedDetail(prev => prev ? { ...prev, status: targetStatus } : null);
                setUpdateModalOpen(false);
                setStatusNote('');
                setRevisionFile(null);
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
        if (serviceFilter) params.append('service_code', serviceFilter);
        if (searchTerm) params.append('search', searchTerm);
        window.open(`/api/v1/export/${format}?${params.toString()}`, '_blank');
    };

    // Group requests for kanban
    const getFilteredGrouped = () => {
        let filtered = requests;
        if (dateFrom) { const from = new Date(dateFrom); from.setHours(0, 0, 0, 0); filtered = filtered.filter(r => new Date(r.created_at) >= from); }
        if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59, 999); filtered = filtered.filter(r => new Date(r.created_at) <= to); }
        const grouped = {};
        activeKanbanColumns.forEach(col => { grouped[col.key] = []; });
        filtered.forEach(req => { if (grouped[req.status]) grouped[req.status].push(req); });
        return grouped;
    };

    const groupedRequests = getFilteredGrouped();

    // Service lookup
    const getServiceName = (req) => req.service?.name || req.kategori || '-';

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {isPic ? 'Daftar Permohonan Layanan Saya' : 'Tracking Permohonan & Riwayat Status'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {user?.role === 'User'
                            ? 'Pantau perkembangan dan estimasi Lead Time permohonan yang Anda ajukan.'
                            : isPic
                                ? `Permohonan masuk ke layanan Anda (${SERVICES.find(s => s.code === picServiceCode)?.name || ''}).`
                                : 'Manajemen antrean permohonan seluruh unit kerja internal.'}
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    {/* View toggle */}
                    {(isAdmin || isPic) && (
                        <div className="flex items-center bg-slate-100 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />Kanban
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                            >
                                <List className="w-3.5 h-3.5 inline mr-1" />Tabel
                            </button>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleExport('csv')} className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer">
                                <Download className="w-3.5 h-3.5 text-slate-500" /><span>CSV</span>
                            </button>
                            <button onClick={() => handleExport('excel')} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer">
                                <Download className="w-3.5 h-3.5" /><span>Excel</span>
                            </button>
                        </div>
                    )}
                </div>
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

                {/* Service Filter — locked badge for PIC, select for Admin/User */}
                {isPic ? (
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-800 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>PIC: {SERVICES.find(s => s.code === (user?.pic_service_code || activeService))?.name || `Layanan (${activeService})`}</span>
                    </div>
                ) : (
                    <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none"
                    >
                        <option value="">Pilih Layanan</option>
                        {SERVICES.map(svc => (
                            <option key={svc.code} value={svc.code}>{svc.name}</option>
                        ))}
                    </select>
                )}

                {/* Date range */}
                <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none" title="Dari tanggal" />
                </div>
                <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slate-400">s/d</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none" title="Sampai tanggal" />
                </div>
                {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="px-2 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors">
                        Reset Tanggal
                    </button>
                )}

                <button onClick={loadRequests} className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-xl transition-colors" title="Refresh data">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Empty state for unselected service in Kanban */}
            {viewMode === 'kanban' && !activeService && (
                <div className="flex-1 flex items-center justify-center min-h-[380px]">
                    <div className="text-center space-y-3 py-16 px-6 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <LayoutGrid className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-800">Pilih Layanan Terlebih Dahulu</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Pilih layanan dari dropdown di atas untuk menampilkan alur status khusus dan Board Kanban permohonan.
                        </p>
                    </div>
                </div>
            )}

            {/* Kanban / Table View */}
            {(viewMode === 'table' || activeService) && (
                viewMode === 'table' ? (
                    /* TABLE VIEW */
                    <div className="flex-1 overflow-auto">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">No. Tiket</th>
                                        <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Tanggal</th>
                                        <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Layanan</th>
                                        <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Judul</th>
                                        <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Pemohon</th>
                                        <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                        <th className="text-right px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                                            <p>Memuat data...</p>
                                        </td></tr>
                                    ) : requests.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs font-medium">Tidak ada permohonan</p>
                                        </td></tr>
                                    ) : requests.map(req => (
                                        <tr
                                            key={req.id}
                                            className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                                            onDoubleClick={() => openDetail(req.id)}
                                            title="Klik ganda (double-click) untuk melihat detail lengkap permohonan"
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-mono font-bold text-indigo-700 text-[11px]">{req.nomor_tiket}</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-slate-800 text-xs">{getFullServiceName(req)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-slate-800 line-clamp-1">{req.judul_permohonan}</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{req.user?.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusBadgeStyles[req.status] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end space-x-1.5">
                                                    {canUpdateStatus && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openUpdateModalForReq(req);
                                                            }}
                                                            className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                                                            title="Ubah status permohonan ini"
                                                        >
                                                            Ubah Status
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openDetail(req.id)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Lihat detail permohonan"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-[11px] text-slate-400 text-center py-2.5 border-t border-slate-100 font-medium">
                                💡 Tips: Double-click (klik ganda) pada baris tabel mana saja untuk langsung memunculkan preview detail lengkap.
                            </p>
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
                                            <div className={`flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] rounded-b-2xl transition-colors duration-150 ${isDropTarget ? `${column.bgCard} bg-opacity-60` : ''}`}>
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
                )
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
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-mono text-sm font-black text-indigo-700">{selectedDetail.nomor_tiket}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusBadgeStyles[selectedDetail.status] || ''}`}>
                                        {selectedDetail.status}
                                    </span>
                                </div>
                                <h3 className="text-base font-extrabold text-slate-900">{selectedDetail.judul_permohonan}</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Diajukan oleh: <strong>{selectedDetail.user?.name}</strong> ({selectedDetail.user?.unit_kerja})
                                </p>
                            </div>
                            <button onClick={() => setSelectedDetail(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-6">
                            {/* Form-specific detail */}
                            <RequestFormDetail detail={selectedDetail} />

                            {/* Attachments */}
                            {selectedDetail.attachments?.length > 0 && (
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
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Riwayat Status Kronologis</h4>
                                <StatusTimeline histories={selectedDetail.status_histories} />
                            </div>

                            {/* Status Update Action */}
                            {canUpdateStatus && (
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">
                                        {isPic ? 'Aksi PIC:' : 'Aksi Admin:'}
                                    </span>
                                    <button
                                        onClick={() => setUpdateModalOpen(true)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs"
                                    >
                                        Ubah Status
                                    </button>
                                </div>
                            )}
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
                            <button onClick={() => setUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                                <select
                                    value={targetStatus}
                                    onChange={(e) => setTargetStatus(e.target.value)}
                                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                                >
                                    {getStatusOptions().map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
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

                            {/* Unggah Berkas/Foto Hasil Revisi (Tahap Pemeriksaan / Revisi) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Unggah Berkas / Foto Hasil Revisi (Opsional)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setRevisionFile(e.target.files[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Berkas hasil revisi / dokumen pemeriksaan konten akan otomatis tersimpan di lampiran permohonan.
                                </p>
                            </div>

                            {/* Tip Alur Desain Grafis */}
                            {selectedDetail?.service?.code === 'D' && (
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                                    💡 <strong>Persetujuan Desain:</strong> Persetujuan akhir dapat dilakukan di luar sistem (misal WhatsApp/Email review). PIC cukup menandai status <strong>'Selesai'</strong> di sistem ini setelah pemohon menyetujui.
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={() => setUpdateModalOpen(false)} className="px-3 py-2 text-xs font-bold text-slate-600">
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
        </div>
    );
}

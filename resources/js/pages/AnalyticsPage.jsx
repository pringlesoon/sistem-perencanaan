import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    BarChart3,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Layers,
    PieChart,
    Building2,
    ListOrdered,
    ShieldCheck,
    Filter,
    Timer,
    CheckCircle,
    RotateCcw
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [serviceCode, setServiceCode] = useState(() => {
        return user?.role === 'PIC' ? (user.pic_service_code || 'ALL') : 'ALL';
    });

    const isPic = user?.role === 'PIC';

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('days', days);
            if (serviceCode && serviceCode !== 'ALL') {
                params.append('service_code', serviceCode);
            }

            const res = await api.get(`/analytics?${params.toString()}`);
            if (res.data?.status === 'success') {
                setAnalytics(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [days, serviceCode]);

    const {
        kpis,
        load_per_service,
        status_breakdown,
        top_units,
        pending_queue,
        selected_service
    } = analytics || {};

    const serviceCodeLabels = {
        D: 'Layanan Desain Grafis [D]',
        P: 'Layanan Publikasi [P]',
        S: 'Layanan Alat Promosi & Suvenir [S]',
        M: 'Layanan Multimedia [M]',
        L: 'Layanan Liputan Berita [L]',
    };

    const serviceOptions = [
        { value: 'ALL', label: 'Semua Layanan (Global)' },
        { value: 'D', label: 'Desain Grafis (D)' },
        { value: 'P', label: 'Publikasi (P)' },
        { value: 'S', label: 'Alat Promosi (S)' },
        { value: 'M', label: 'Multimedia (M)' },
        { value: 'L', label: 'Liputan Berita (L)' },
    ];

    const dayOptions = [
        { value: 7, label: '7 Hari Terakhir' },
        { value: 30, label: '30 Hari Terakhir' },
        { value: 90, label: '90 Hari Terakhir' },
        { value: 0, label: 'Semua Periode' },
    ];

    const statusBadgeStyles = {
        Diajukan: 'bg-amber-50 text-amber-700 border-amber-200',
        Diproses: 'bg-blue-50 text-blue-700 border-blue-200',
        Direvisi: 'bg-orange-50 text-orange-700 border-orange-200',
        'Menunggu Approval Sebagian': 'bg-purple-50 text-purple-700 border-purple-200',
        Selesai: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Ditolak: 'bg-rose-50 text-rose-700 border-rose-200',
    };

    const statusProgressColors = {
        Diajukan: 'bg-amber-500',
        Diproses: 'bg-blue-500',
        Direvisi: 'bg-orange-500',
        'Menunggu Approval Sebagian': 'bg-purple-500',
        Selesai: 'bg-emerald-500',
        Ditolak: 'bg-rose-500',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
            {/* Header & Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center space-x-2">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            {isPic
                                ? `Dasbor Analitik Kinerja Layanan`
                                : `Dasbor Analitik Kinerja & Beban Kerja`}
                        </h2>
                        {isPic && user?.pic_service_code && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
                                {serviceCodeLabels[user.pic_service_code] || `PIC ${user.pic_service_code}`}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {isPic
                            ? `Pantau metrik kecepatan pelayanan, volume pengajuan, dan permohonan aktif pada layanan Anda.`
                            : `Pemantauan metrik penuntasan layanan, efisiensi waktu respon, dan distribusi beban kerja tim.`}
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Filter Layanan (hanya untuk Admin & SuperAdmin) */}
                    {!isPic && (
                        <div className="w-56">
                            <CustomSelect
                                value={serviceCode}
                                onChange={(val) => setServiceCode(val)}
                                options={serviceOptions}
                                icon={Filter}
                                placeholder="Pilih Lingkup Layanan"
                            />
                        </div>
                    )}

                    {/* Filter Periode Waktu */}
                    <div className="w-48">
                        <CustomSelect
                            value={days}
                            onChange={(val) => setDays(Number(val))}
                            options={dayOptions}
                            icon={Calendar}
                            placeholder="Periode Waktu"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={loadAnalytics}
                        title="Muat Ulang Data"
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs"
                    >
                        <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-24 text-center">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-bold">Memperbarui metrik analitik layanan...</p>
                </div>
            ) : (
                <>
                    {/* 4 Kartu KPI Utama */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Permohonan */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4 hover:border-slate-300 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                                <Layers className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Permohonan</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis?.total_requests || 0}</h3>
                                <p className="text-[10px] text-slate-500 font-medium">
                                    {kpis?.rejected_requests > 0 ? `${kpis.rejected_requests} ditolak` : 'Tiket teregistrasi'}
                                </p>
                            </div>
                        </div>

                        {/* Permohonan Selesai */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4 hover:border-slate-300 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tuntas Selesai</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis?.completed_requests || 0}</h3>
                                <p className="text-[10px] text-emerald-600 font-bold">
                                    {kpis?.completion_rate || 0}% Completion Rate
                                </p>
                            </div>
                        </div>

                        {/* Antrean & Dalam Proses */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4 hover:border-slate-300 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sedang Berjalan</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis?.active_requests || 0}</h3>
                                <p className="text-[10px] text-amber-600 font-semibold">Dalam antrean / proses kerja</p>
                            </div>
                        </div>

                        {/* Rata-Rata Lead Time */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4 hover:border-slate-300 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-Rata Lead Time</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis?.avg_lead_time || '0 jam'}</h3>
                                <p className="text-[10px] text-sky-600 font-semibold">
                                    {kpis?.fastest_lead_time && kpis?.fastest_lead_time !== '0 jam'
                                        ? `Tercepat: ${kpis.fastest_lead_time}`
                                        : 'Waktu respon tuntas'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Grid Utama: Distribusi Status & Top Unit Pemohon */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Distribusi Status Saat Ini */}
                        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900">Distribusi Status Alur Kerja</h4>
                                    <p className="text-xs text-slate-500">Rincian permohonan berdasarkan tahapan proses saat ini.</p>
                                </div>
                                <PieChart className="w-5 h-5 text-indigo-600" />
                            </div>

                            <div className="space-y-3 pt-2">
                                {status_breakdown && Object.entries(status_breakdown).map(([status, item]) => (
                                    <div key={status} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center space-x-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${statusProgressColors[status] || 'bg-slate-400'}`} />
                                                <span className="font-bold text-slate-700">{status}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-extrabold text-slate-900">{item.count} tiket</span>
                                                <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${statusProgressColors[status] || 'bg-slate-400'}`}
                                                style={{ width: `${Math.max(item.percentage, item.count > 0 ? 3 : 0)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top 5 Unit Kerja Pemohon Terbanyak */}
                        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900">Top Unit Kerja Pemohon</h4>
                                    <p className="text-xs text-slate-500">Program studi atau unit yang paling aktif mengajukan.</p>
                                </div>
                                <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>

                            <div className="space-y-2.5 pt-2">
                                {top_units && top_units.length > 0 ? (
                                    top_units.map((unit, index) => {
                                        const maxUnitTotal = Math.max(...top_units.map(u => u.total), 1);
                                        const widthPercent = Math.max(Math.round((unit.total / maxUnitTotal) * 100), 10);

                                        return (
                                            <div
                                                key={unit.unit_kerja}
                                                className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                                            >
                                                <div className="flex items-center space-x-3 min-w-0 pr-2">
                                                    <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                                        index === 0
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : index === 1
                                                            ? 'bg-slate-200 text-slate-700'
                                                            : index === 2
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'bg-white text-slate-600 border border-slate-200'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 truncate" title={unit.unit_kerja}>
                                                            {unit.unit_kerja}
                                                        </p>
                                                        <div className="w-24 bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                                                            <div
                                                                className="h-full bg-indigo-600 rounded-full"
                                                                style={{ width: `${widthPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg shrink-0">
                                                    {unit.total} tiket
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 text-center text-slate-400 text-xs">
                                        Belum ada riwayat pengajuan unit kerja pada periode ini.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grid Kedua: Antrean Aktif Perlu Tindakan & Matriks Kinerja Layanan */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Antrean Aktif Perlu Tindakan Segera */}
                        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900">Antrean Aktif Berjalan Terlama</h4>
                                    <p className="text-xs text-slate-500">Permohonan yang masih diproses/menunggu tindakan prioritas.</p>
                                </div>
                                <Timer className="w-5 h-5 text-amber-600" />
                            </div>

                            <div className="space-y-3 pt-1">
                                {pending_queue && pending_queue.length > 0 ? (
                                    pending_queue.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-mono text-[11px] font-black text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                                        {item.nomor_tiket}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusBadgeStyles[item.status] || 'bg-slate-100 text-slate-700'}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                                                    ⏱ {item.lead_time_running}
                                                </span>
                                            </div>

                                            <p className="text-xs font-extrabold text-slate-900 line-clamp-1">
                                                {item.judul_permohonan}
                                            </p>

                                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                                                <span>{item.pemohon} • {item.unit_kerja}</span>
                                                <span>Diajukan: {item.created_at}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-emerald-600 text-xs font-semibold flex flex-col items-center justify-center space-y-2">
                                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                                        <span>Semua permohonan telah tuntas diselesaikan! Tidak ada antrean pending.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Matriks Beban & Performa Seluruh Layanan (FR-AN-02) */}
                        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900">Performa Layanan Humas & Marketing</h4>
                                    <p className="text-xs text-slate-500">Perbandingan efisiensi dan lead time seluruh layanan.</p>
                                </div>
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                            </div>

                            <div className="overflow-x-auto pt-1">
                                <table className="w-full text-xs text-left text-slate-600">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                                            <th className="pb-2.5">Layanan</th>
                                            <th className="pb-2.5 text-center">Total</th>
                                            <th className="pb-2.5 text-center">Selesai</th>
                                            <th className="pb-2.5 text-center">Aktif</th>
                                            <th className="pb-2.5 text-right">Rata-Rata Lead Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {load_per_service?.map((srv) => (
                                            <tr key={srv.code} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-2.5 font-bold text-slate-900 flex items-center space-x-2">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                                    <span>[{srv.code}] {srv.name}</span>
                                                </td>
                                                <td className="py-2.5 text-center font-bold text-slate-800">
                                                    {srv.count}
                                                </td>
                                                <td className="py-2.5 text-center text-emerald-600 font-bold">
                                                    {srv.selesai} ({srv.completion_rate}%)
                                                </td>
                                                <td className="py-2.5 text-center text-amber-600 font-bold">
                                                    {srv.aktif}
                                                </td>
                                                <td className="py-2.5 text-right font-black text-sky-700">
                                                    {srv.avg_lead_time}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    BarChart3,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Layers,
    PieChart
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics?days=${days}`);
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
    }, [days]);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-bold">Menghitung metrik analitik divisi...</p>
            </div>
        );
    }

    const { kpis, load_per_service, trend, status_breakdown } = analytics || {};

    const serviceColors = {
        D: 'bg-indigo-500',
        P: 'bg-sky-500',
        S: 'bg-amber-500',
        M: 'bg-emerald-500',
        L: 'bg-rose-500',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
            {/* Header & Date Range Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Dasbor Analitik Beban Kerja & Lead Time
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Agregat data permohonan divisi Marketing & Humas untuk evaluasi operasional (PRD FR-AN-01).
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <CustomSelect
                        value={days}
                        onChange={(val) => setDays(Number(val))}
                        options={[
                            { value: 7, label: '7 Hari Terakhir' },
                            { value: 30, label: '30 Hari Terakhir' },
                            { value: 90, label: '90 Hari Terakhir' },
                            { value: 0, label: 'Sepanjang Waktu (All Time)' },
                        ]}
                        placeholder="Periode Waktu"
                        align="right"
                    />
                </div>
            </div>

            {/* 4 KPI Cards (PRD Section 9.4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Requests */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Permohonan</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis?.total_requests || 0}</h3>
                        <p className="text-[10px] text-slate-500">Semua kategori</p>
                    </div>
                </div>

                {/* Completed Requests */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selesai Dikerjakan</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis?.completed_requests || 0}</h3>
                        <p className="text-[10px] text-emerald-600 font-semibold">{kpis?.completion_rate}% Tingkat Tuntas</p>
                    </div>
                </div>

                {/* Active Requests */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sedang Berjalan</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis?.active_requests || 0}</h3>
                        <p className="text-[10px] text-amber-600 font-semibold">Dalam antrean/proses</p>
                    </div>
                </div>

                {/* Average Lead Time */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-Rata Lead Time</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis?.avg_lead_time || '0 jam'}</h3>
                        <p className="text-[10px] text-sky-600 font-semibold">Waktu respon tuntas</p>
                    </div>
                </div>
            </div>

            {/* Visual Charts Grid (Beban per Layanan + Status Breakdown) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bar Chart: Beban Kerja per Layanan (PRD FR-AN-02) */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-extrabold text-slate-900">Beban Kerja Tiap Layanan (D/P/S/M/L)</h4>
                            <p className="text-xs text-slate-500">Distribusi permohonan masuk berdasarkan jenis layanan.</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>

                    <div className="space-y-4 pt-2">
                        {load_per_service?.map(service => (
                            <div key={service.code} className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <span>[{service.code}] {service.name}</span>
                                    <span>{service.count} request ({service.percentage}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${serviceColors[service.code] || 'bg-indigo-500'}`}
                                        style={{ width: `${Math.max(service.percentage, 2)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Breakdown & Tren Ringkas */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-extrabold text-slate-900">Distribusi Status Saat Ini</h4>
                            <p className="text-xs text-slate-500">Kondisi permohonan dalam alur pengerjaan.</p>
                        </div>
                        <PieChart className="w-5 h-5 text-indigo-600" />
                    </div>

                    <div className="space-y-2.5 pt-2 text-xs">
                        {status_breakdown && Object.entries(status_breakdown).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="font-semibold text-slate-700">{status}</span>
                                <span className="font-black text-slate-900 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tren Pengajuan Permohonan (Waktu) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Tren Pengajuan Permohonan Harian</h4>
                        <p className="text-xs text-slate-500">Histori volume permohonan yang diajukan ke sistem SAPT.</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>

                {trend?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">Belum ada riwayat permohonan pada periode ini.</p>
                ) : (
                    <div className="overflow-x-auto pt-2">
                        <div className="min-w-[500px] flex items-end space-x-3 h-48 border-b border-slate-200 pb-2">
                            {trend?.map((item, idx) => {
                                const maxVal = Math.max(...trend.map(t => t.total), 1);
                                const heightPercent = Math.max((item.total / maxVal) * 100, 10);

                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center justify-end group">
                                        <span className="text-[10px] font-bold text-indigo-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.total}
                                        </span>
                                        <div
                                            className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all group-hover:from-indigo-700 group-hover:to-indigo-500"
                                            style={{ height: `${heightPercent}%` }}
                                            title={`${item.date}: ${item.total} permohonan (${item.selesai} selesai)`}
                                        />
                                        <span className="text-[9px] text-slate-400 mt-2 truncate w-full text-center">
                                            {item.date.slice(5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

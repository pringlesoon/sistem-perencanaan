import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ServiceCard from '../components/ServiceCard';
import api from '../services/api';
import { Sparkles, ArrowRight, ListOrdered, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DashboardPage({ onSelectService, onGoToTracking }) {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [summary, setSummary] = useState({ active: 0, completed: 0, needsApproval: 0 });
    const [loading, setLoading] = useState(true);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [servicesRes, requestsRes] = await Promise.all([
                api.get('/services'),
                api.get('/requests?per_page=50'),
            ]);

            if (servicesRes.data?.status === 'success') {
                setServices(servicesRes.data.data);
            }

            if (requestsRes.data?.status === 'success') {
                const list = requestsRes.data.data.data || [];
                const active = list.filter(r => ['Diajukan', 'Diproses', 'Direvisi', 'Menunggu Approval Sebagian'].includes(r.status)).length;
                const completed = list.filter(r => r.status === 'Selesai').length;
                const needsApproval = list.filter(r => r.status === 'Menunggu Approval Sebagian').length;

                setSummary({ active, completed, needsApproval });
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
            {/* Top Welcome & KPI Banner PRD Section 9.1 */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center space-x-2 text-green-300 text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>Sistem Layanan Marketing — Universitas YARSI</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                            Selamat Datang, {user?.name}!
                        </h2>
                        <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
                            {user?.unit_kerja} • Pilih salah satu layanan di bawah untuk mengajukan permohonan baru.
                        </p>
                    </div>

                    {/* Quick Stats Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl">
                            <p className="text-[10px] uppercase font-bold text-indigo-200">Permohonan Aktif</p>
                            <p className="text-lg font-black text-amber-300">{summary.active}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl">
                            <p className="text-[10px] uppercase font-bold text-indigo-200">Selesai</p>
                            <p className="text-lg font-black text-emerald-300">{summary.completed}</p>
                        </div>
                        <button
                            onClick={onGoToTracking}
                            className="px-4 py-3 bg-white text-indigo-900 font-extrabold text-xs rounded-2xl hover:bg-indigo-50 shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                        >
                            <ListOrdered className="w-4 h-4 text-indigo-600" />
                            <span>Pantau Status</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 5 Layanan Utama Grid (PRD FR-DASH-01, Section 9.1) */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Layanan Marketing Universitas YARSI</h3>
                        <p className="text-xs text-slate-500">Pilih kartu layanan untuk membuka Formulir Split-Screen beserta Syarat & Ketentuan.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {services.map(service => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                onSelect={(code) => onSelectService(code)}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Settings,
    Save,
    CheckCircle2,
    AlertCircle,
    Edit3,
    ShieldAlert,
    Layers,
    Power,
    Palette,
    Megaphone,
    Gift,
    Video,
    Camera,
    Info,
    Sliders
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const SERVICE_ICONS = {
    D: Palette,
    P: Megaphone,
    S: Gift,
    M: Video,
    L: Camera,
};

const SERVICE_THEMES = {
    D: { colorDot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    P: { colorDot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
    S: { colorDot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    M: { colorDot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    L: { colorDot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function SettingsPage() {
    const { user } = useAuth();
    const canManage = ['Admin', 'SuperAdmin'].includes(user?.role);

    const [configs, setConfigs] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedServiceCode, setSelectedServiceCode] = useState('D');

    // Editable fields for selected service
    const [editingName, setEditingName] = useState('');
    const [editingDesc, setEditingDesc] = useState('');
    const [editingIsActive, setEditingIsActive] = useState(true);
    const [editingRules, setEditingRules] = useState('');

    const [loading, setLoading] = useState(true);
    const [savingService, setSavingService] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            const [cfgRes, srvRes] = await Promise.all([
                api.get('/config'),
                api.get('/services'),
            ]);

            if (cfgRes.data?.status === 'success') {
                setConfigs(cfgRes.data.data);
            }
            if (srvRes.data?.status === 'success') {
                setServices(srvRes.data.data);
                const current = srvRes.data.data.find(s => s.code === selectedServiceCode) || srvRes.data.data[0];
                if (current) {
                    setSelectedServiceCode(current.code);
                    setEditingName(current.name || '');
                    setEditingDesc(current.description || '');
                    setEditingIsActive(current.is_active ?? true);
                    setEditingRules(current.rules_text || '');
                }
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            setErrorMsg('Gagal memuat pengaturan sistem.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canManage) {
            loadData();
        }
    }, [user]);

    useEffect(() => {
        const current = services.find(s => s.code === selectedServiceCode);
        if (current) {
            setEditingName(current.name || '');
            setEditingDesc(current.description || '');
            setEditingIsActive(current.is_active ?? true);
            setEditingRules(current.rules_text || '');
        }
    }, [selectedServiceCode, services]);

    const handleConfigChange = (id, newVal) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, config_value: newVal } : c));
    };

    const saveConfigs = async () => {
        setSavingConfig(true);
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            const payload = configs.map(c => ({ id: c.id, config_value: c.config_value }));
            const res = await api.put('/config', { configs: payload });
            if (res.data?.status === 'success') {
                setStatusMsg('Parameter bisnis berhasil diperbarui.');
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Gagal menyimpan konfigurasi parameter bisnis.');
        } finally {
            setSavingConfig(false);
        }
    };

    const saveServiceDetails = async () => {
        setSavingService(true);
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            const res = await api.put(`/services/${selectedServiceCode}`, {
                name: editingName,
                description: editingDesc,
                is_active: editingIsActive,
                rules_text: editingRules,
            });
            if (res.data?.status === 'success') {
                setStatusMsg(`Layanan [${selectedServiceCode}] ${editingName} berhasil disimpan.`);
                setServices(prev => prev.map(s => s.code === selectedServiceCode ? {
                    ...s,
                    name: editingName,
                    description: editingDesc,
                    is_active: editingIsActive,
                    rules_text: editingRules,
                } : s));
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Gagal menyimpan pembaruan layanan.');
        } finally {
            setSavingService(false);
        }
    };

    if (!canManage) {
        return (
            <div className="max-w-md mx-auto py-16 text-center">
                <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-lg">Akses Ditolak</h3>
                <p className="text-xs text-slate-500 mt-1">
                    Halaman kelola layanan hanya dapat diakses oleh SuperAdmin dan Admin sistem.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-bold">Memuat konfigurasi layanan...</p>
            </div>
        );
    }

    const currentService = services.find(s => s.code === selectedServiceCode);
    const SvcIcon = SERVICE_ICONS[selectedServiceCode] || Layers;
    const currentTheme = SERVICE_THEMES[selectedServiceCode] || { colorDot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200">
                            Akses: {user?.role}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Modul Kelola Layanan</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Kelola Layanan & Parameter Sistem
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola informasi layanan, status operasional, syarat & ketentuan alur kerja (rules), serta parameter aturan bisnis.
                    </p>
                </div>
            </div>

            {/* Notification Messages */}
            {statusMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center space-x-2 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{statusMsg}</span>
                </div>
            )}

            {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center space-x-2 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Service Configuration Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-slate-900">Pengaturan Detail Layanan</h3>
                            <p className="text-[11px] text-slate-400">Pilih layanan di bawah untuk mengubah informasi dan aturan alur kerjanya.</p>
                        </div>
                    </div>

                    <button
                        onClick={saveServiceDetails}
                        disabled={savingService}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                    >
                        <Save className="w-4 h-4" />
                        <span>{savingService ? 'Menyimpan...' : 'Simpan Layanan'}</span>
                    </button>
                </div>

                {/* Service Selector Tabs / Pills */}
                <div className="flex flex-wrap gap-2">
                    {services.map(svc => {
                        const Icon = SERVICE_ICONS[svc.code] || Layers;
                        const isSelected = svc.code === selectedServiceCode;
                        return (
                            <button
                                key={svc.code}
                                type="button"
                                onClick={() => setSelectedServiceCode(svc.code)}
                                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>[{svc.code}] {svc.name}</span>
                                {!svc.is_active && (
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-200 text-slate-600'}`}>
                                        Nonaktif
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Service Fields Form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Kode Layanan (Read Only) */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Kode Layanan
                        </label>
                        <div className="flex items-center space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                            <span>{selectedServiceCode}</span>
                        </div>
                    </div>

                    {/* Nama Layanan */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Nama Layanan
                        </label>
                        <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="Nama Layanan..."
                            className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Status Aktif */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Status Operasional Layanan
                        </label>
                        <div className="flex items-center space-x-2 h-9">
                            <button
                                type="button"
                                onClick={() => setEditingIsActive(prev => !prev)}
                                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${editingIsActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                    }`}
                            >
                                <Power className={`w-3.5 h-3.5 ${editingIsActive ? 'text-emerald-600' : 'text-rose-600'}`} />
                                <span>{editingIsActive ? 'Aktif (Dapat Diajukan)' : 'Non-aktif (Ditutup Sementara)'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Deskripsi Singkat Layanan */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Deskripsi Singkat Layanan
                    </label>
                    <textarea
                        rows={2}
                        value={editingDesc}
                        onChange={(e) => setEditingDesc(e.target.value)}
                        placeholder="Deskripsi ringkas layanan ini untuk user..."
                        className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                    />
                </div>

                {/* Aturan Main & Syarat Layanan */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Aturan Main & Ketentuan Pengajuan (Markdown)
                        </label>
                        <span className="text-[10px] text-slate-400">
                            Mendukung format Markdown: <code>### Judul</code>, <code>1. Poin</code>, <code>**tebal**</code>
                        </span>
                    </div>
                    <textarea
                        rows={10}
                        value={editingRules}
                        onChange={(e) => setEditingRules(e.target.value)}
                        className="w-full p-4 font-mono text-xs border border-slate-300 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center space-x-1">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Teks aturan main ini langsung tampil pada panel panduan sisi kiri (Split-Screen) formulir pengajuan bagi pengguna.</span>
                    </p>
                </div>
            </div>

            {/* Parameter Bisnis (PRD NFR-MAINT-02) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-slate-900">Parameter Aturan Bisnis</h3>
                            <p className="text-[11px] text-slate-400">Konfigurasi batas kuota auto-approval dan durasi multimedia tanpa perlu deploy ulang kode.</p>
                        </div>
                    </div>
                    <button
                        onClick={saveConfigs}
                        disabled={savingConfig}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>{savingConfig ? 'Menyimpan...' : 'Simpan Parameter'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {configs.map(cfg => (
                        <div key={cfg.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-black text-slate-800">
                                    {cfg.config_key === 'auto_approval_limit' ? 'Batas Auto-Approval Suvenir' : 'Durasi Maksimal Multimedia'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                    [{cfg.service?.code || '-'}]
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                                {cfg.description}
                            </p>
                            <div className="pt-1 flex items-center space-x-2">
                                <input
                                    type="number"
                                    value={cfg.config_value}
                                    onChange={(e) => handleConfigChange(cfg.id, e.target.value)}
                                    className="w-32 px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-xs text-slate-500 font-semibold">
                                    {cfg.config_key === 'auto_approval_limit' ? 'unit' : 'menit'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

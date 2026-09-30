import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Settings, Save, CheckCircle2, AlertCircle, Edit3, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const [configs, setConfigs] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedServiceCode, setSelectedServiceCode] = useState('D');
    const [editingRules, setEditingRules] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);
    const [savingRules, setSavingRules] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    const loadData = async () => {
        setLoading(true);
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
                const current = srvRes.data.data.find(s => s.code === selectedServiceCode);
                if (current) {
                    setEditingRules(current.rules_text || '');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const current = services.find(s => s.code === selectedServiceCode);
        if (current) {
            setEditingRules(current.rules_text || '');
        }
    }, [selectedServiceCode, services]);

    const handleConfigChange = (id, newVal) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, config_value: newVal } : c));
    };

    const saveConfigs = async () => {
        setSavingConfig(true);
        setStatusMsg(null);
        try {
            const payload = configs.map(c => ({ id: c.id, config_value: c.config_value }));
            const res = await api.put('/config', { configs: payload });
            if (res.data?.status === 'success') {
                setStatusMsg('Parameter bisnis berhasil diperbarui.');
            }
        } catch (err) {
            alert('Gagal menyimpan konfigurasi.');
        } finally {
            setSavingConfig(false);
        }
    };

    const saveRules = async () => {
        setSavingRules(true);
        setStatusMsg(null);
        try {
            const res = await api.put(`/services/${selectedServiceCode}/rules`, {
                rules_text: editingRules,
            });
            if (res.data?.status === 'success') {
                setStatusMsg(`Aturan Main untuk [${selectedServiceCode}] berhasil disimpan.`);
                setServices(prev => prev.map(s => s.code === selectedServiceCode ? { ...s, rules_text: editingRules } : s));
            }
        } catch (err) {
            alert('Gagal menyimpan Aturan Main.');
        } finally {
            setSavingRules(false);
        }
    };

    if (!user?.isAdmin()) {
        return (
            <div className="max-w-md mx-auto py-16 text-center">
                <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800">Akses Ditolak</h3>
                <p className="text-xs text-slate-500 mt-1">Halaman pengaturan hanya dapat diakses oleh Admin / Pelaksana.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-bold">Memuat pengaturan sistem...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
            <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Pengelolaan Sistem & Parameter Bisnis
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Ubah batas kuota auto-approval, batas maksimal durasi booking, dan teks Aturan Main per layanan tanpa perlu deployment ulang (PRD NFR-MAINT-02).
                </p>
            </div>

            {statusMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{statusMsg}</span>
                </div>
            )}

            {/* Parameter Bisnis (PRD NFR-MAINT-02) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-extrabold text-sm text-slate-900">Parameter Aturan Bisnis</h3>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Master Aturan Main per Layanan */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                        <Edit3 className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-extrabold text-sm text-slate-900">Aturan Main & Syarat Layanan</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                        <select
                            value={selectedServiceCode}
                            onChange={(e) => setSelectedServiceCode(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                        >
                            {services.map(s => (
                                <option key={s.code} value={s.code}>
                                    [{s.code}] {s.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={saveRules}
                            disabled={savingRules}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            <span>{savingRules ? 'Menyimpan...' : 'Simpan Aturan'}</span>
                        </button>
                    </div>
                </div>

                <p className="text-xs text-slate-500">
                    Teks ini langsung dirender di kolom kiri Split-Screen pada formulir pengajuan layanan. Gunakan format markdown dasar (`### Judul`, `1. Poin`, `- Subpoin`, `**tebal**`).
                </p>

                <textarea
                    rows={12}
                    value={editingRules}
                    onChange={(e) => setEditingRules(e.target.value)}
                    className="w-full p-4 font-mono text-xs border border-slate-300 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                />
            </div>
        </div>
    );
}

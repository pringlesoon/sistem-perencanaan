import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const { login, quickSwitch } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err.message || 'Login gagal. Periksa username dan password LDAP Anda.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = async (usr) => {
        setError(null);
        setLoading(true);
        try {
            await quickSwitch(usr);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="text-center mb-8">
                    <img
                        src="/images/logo-yarsi.png"
                        alt="Logo YARSI"
                        className="w-16 h-16 rounded-none object-cover shadow-lg mx-auto mb-3"
                    />
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Sistem Layanan Marketing</h1>
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mt-0.5">
                        Universitas YARSI
                    </p>

                    <p className="text-xs text-slate-500 mt-2">
                        Silakan masuk dengan akun direktori internal (LDAP / SSO).
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start space-x-2.5 animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{error}</span>
                    </div>
                )}

                {/* Form Login */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Username LDAP
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="mis. andi, sari, budi"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Password LDAP
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                    >
                        <span>{loading ? 'Memvalidasi LDAP...' : 'Masuk via LDAP SSO'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                {/* Demo Quick Persona Selectors */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-center space-x-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Akses Uji Coba Cepat (PRD Demo)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('andi')}
                            className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-xl text-center transition-all group"
                        >
                            <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Andi</p>
                            <p className="text-[10px] text-slate-500">Pemohon</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('sari')}
                            className="p-2.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-xl text-center transition-all group"
                        >
                            <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Sari</p>
                            <p className="text-[10px] text-slate-500">Admin</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('budi')}
                            className="p-2.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-xl text-center transition-all group"
                        >
                            <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Pak Budi</p>
                            <p className="text-[10px] text-slate-500">Approver</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('dina')}
                            className="p-2.5 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 border border-slate-200 rounded-xl text-center transition-all group"
                        >
                            <p className="text-xs font-bold text-slate-800 group-hover:text-cyan-700">Dina</p>
                            <p className="text-[10px] text-slate-500">Verificator</p>
                        </button>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center space-x-1.5 text-[10px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Terhubung ke Layanan Direktori LDAP Institusi</span>
                </div>
            </div>
        </div>
    );
}

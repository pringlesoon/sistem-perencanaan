import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Sparkles, ArrowRight, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage({ onBackToGuest, onSuccess }) {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await login(username, password);
            if (onSuccess) {
                onSuccess(res?.data?.user);
            }
        } catch (err) {
            setError(err.message || 'Login gagal. Periksa username dan password Anda.');
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

                {/* Back to Guest button */}
                {onBackToGuest && (
                    <button
                        onClick={onBackToGuest}
                        className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-700 mb-5 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Beranda</span>
                    </button>
                )}

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
                        Silakan masuk dengan akun direktori internal.
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
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="mis. andi, superadmin, ahmad"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
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
                        <span>{loading ? 'Memvalidasi...' : 'Login'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                {/* Info: Demo accounts */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-center space-x-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Akun Demo (Password: password)</span>
                    </div>

                    <div className="space-y-1.5 text-[10px] text-slate-500">
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <p className="font-bold text-slate-700">andi</p>
                                <p>Pemohon (User)</p>
                            </div>
                            <div className="bg-violet-50 p-2 rounded-lg border border-violet-100">
                                <p className="font-bold text-violet-700">superadmin</p>
                                <p>Super Admin</p>
                            </div>
                            <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                <p className="font-bold text-indigo-700">ahmad</p>
                                <p>PIC Desain</p>
                            </div>
                            <div className="bg-sky-50 p-2 rounded-lg border border-sky-100">
                                <p className="font-bold text-sky-700">nurhaliza</p>
                                <p>PIC Publikasi</p>
                            </div>
                            <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                                <p className="font-bold text-amber-700">bagas</p>
                                <p>PIC Alat Promosi</p>
                            </div>
                            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                <p className="font-bold text-emerald-700">dewi</p>
                                <p>PIC Multimedia</p>
                            </div>
                            <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
                                <p className="font-bold text-rose-700">rizky</p>
                                <p>PIC Liputan</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <p className="font-bold text-slate-600">fajar, maya, dll</p>
                                <p>User Biasa</p>
                            </div>
                        </div>
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

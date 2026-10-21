import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import {
    Users, Shield, UserCheck, UserX,
    ChevronDown, Check, ShieldAlert, Loader2, RefreshCw,
    Briefcase, AlertCircle, X, Search, Filter,
    ChevronLeft, ChevronRight, Power, Info, CheckCircle2, Lock
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const SERVICES = [
    { code: 'D', name: 'Layanan Desain Grafis', color: 'indigo' },
    { code: 'P', name: 'Layanan Publikasi Website & Social Media', color: 'sky' },
    { code: 'S', name: 'Layanan Permohonan Alat Promosi', color: 'amber' },
    { code: 'M', name: 'Layanan Multimedia, Dokumentasi, & Live Streaming', color: 'emerald' },
    { code: 'L', name: 'Layanan Liputan & Berita', color: 'rose' },
];

const roleBadgeColor = {
    SuperAdmin: 'bg-violet-100 text-violet-700 border-violet-200',
    'Tata Usaha': 'bg-blue-100 text-blue-700 border-blue-200',
    PIC: 'bg-green-100 text-green-700 border-green-200',
    User: 'bg-slate-100 text-slate-700 border-slate-200',
};

const serviceBadgeColor = {
    D: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    P: 'bg-sky-50 text-sky-700 border border-sky-200',
    S: 'bg-amber-50 text-amber-700 border border-amber-200',
    M: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    L: 'bg-rose-50 text-rose-700 border border-rose-200',
};

/**
 * Modal untuk Ubah Role & PIC Layanan (Superadmin Only)
 */
function ChangeRoleModal({ user, onClose, onUpdated }) {
    const [selectedRole, setSelectedRole] = useState(user.role || 'User');
    const [selectedService, setSelectedService] = useState(user.pic_service_code || 'D');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                role: selectedRole,
                pic_service_code: selectedRole === 'PIC' ? selectedService : null,
            };

            const res = await api.patch(`/users/${user.id}/role`, payload);
            if (res.data?.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Role Diperbarui',
                    text: res.data.message || `Role akun ${user.name} berhasil diperbarui.`,
                    timer: 2000,
                    showConfirmButton: false,
                });
                onUpdated();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memperbarui role pengguna.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-violet-600" />
                            <span>Ubah Role Pengguna</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Untuk: <strong>{user.name}</strong> ({user.username})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-700 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Data Sinkronisasi LDAP Kampus (Read-Only)</span>
                    </p>
                    <p className="text-slate-500">Nama, email, dan password dikelola terpusat via SSO Kampus dan tidak dapat diubah di sini.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            Pilih Hak Akses (Role):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'User', label: 'User Biasa', desc: 'Pengajuan standar' },
                                { key: 'Tata Usaha', label: 'Tata Usaha (TU)', desc: 'Akses penuh seluruh 5 layanan' },
                                { key: 'PIC', label: 'PIC Layanan', desc: 'Verifikasi & tindak lanjut' },
                                { key: 'SuperAdmin', label: 'Super Admin', desc: 'Akses penuh sistem' },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setSelectedRole(item.key)}
                                    className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                                        selectedRole === item.key
                                            ? 'bg-violet-50 border-violet-500 ring-2 ring-violet-200 text-violet-900'
                                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold">{item.label}</span>
                                        {selectedRole === item.key && <Check className="w-3.5 h-3.5 text-violet-600" />}
                                    </div>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">{item.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedRole === 'PIC' && (
                        <div className="pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                            <label className="block text-xs font-bold text-slate-700 mb-2">
                                Tetapkan Sebagai PIC Layanan: <span className="text-rose-500">*</span>
                            </label>
                            <div className="space-y-2">
                                {SERVICES.map(svc => (
                                    <button
                                        key={svc.code}
                                        type="button"
                                        onClick={() => setSelectedService(svc.code)}
                                        className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                            selectedService === svc.code
                                                ? 'bg-green-600 text-white border-green-600 shadow-xs'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>[{svc.code}] {svc.name}</span>
                                            {selectedService === svc.code && <Check className="w-3.5 h-3.5" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-60 transition-colors cursor-pointer"
                        >
                            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>{submitting ? 'Menyimpan...' : 'Simpan Role'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UserManagementPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10,
        from: 0,
        to: 0,
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedUserForRole, setSelectedUserForRole] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const loadUsers = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page: page,
                per_page: 10,
            };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (filterRole) params.role = filterRole;
            if (filterStatus) params.status = filterStatus;

            const res = await api.get('/users', { params });
            if (res.data?.status === 'success') {
                const paginated = res.data.data;
                setUsers(paginated.data || []);
                setPagination({
                    current_page: paginated.current_page || 1,
                    last_page: paginated.last_page || 1,
                    total: paginated.total || 0,
                    per_page: paginated.per_page || 10,
                    from: paginated.from || 0,
                    to: paginated.to || 0,
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Memuat Data',
                text: err.response?.data?.message || 'Terjadi kesalahan saat memuat data pengguna.',
            });
        } finally {
            setLoading(false);
        }
    };

    // Load initial data & reload when filters change
    useEffect(() => {
        const timeout = setTimeout(() => {
            loadUsers(1);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm, filterRole, filterStatus]);

    // Handler Toggle Status Akun (Aktifkan / Nonaktifkan)
    const handleToggleStatus = async (user) => {
        if (currentUser && user.id === currentUser.id) {
            Swal.fire({
                icon: 'warning',
                title: 'Operasi Dibatalkan',
                text: 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
            });
            return;
        }

        const willDeactivate = user.is_active;
        const confirmTitle = willDeactivate ? 'Nonaktifkan Akun Pengguna?' : 'Aktifkan Kembali Akun Pengguna?';
        const confirmText = willDeactivate
            ? `Pengguna "${user.name}" (${user.username}) tidak akan dapat login ke dalam sistem meskipun password LDAP-nya benar.`
            : `Pengguna "${user.name}" (${user.username}) akan dapat login kembali ke dalam sistem menggunakan akun LDAP kampus.`;

        const result = await Swal.fire({
            icon: willDeactivate ? 'warning' : 'question',
            title: confirmTitle,
            text: confirmText,
            showCancelButton: true,
            confirmButtonColor: willDeactivate ? '#e11d48' : '#16a34a',
            cancelButtonColor: '#64748b',
            confirmButtonText: willDeactivate ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        setActionLoadingId(user.id);
        try {
            const res = await api.patch(`/users/${user.id}/toggle-status`, {
                is_active: !user.is_active,
            });

            if (res.data?.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Status Berhasil Diubah',
                    text: res.data.message,
                    timer: 2000,
                    showConfirmButton: false,
                });
                loadUsers(pagination.current_page);
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Mengubah Status',
                text: err.response?.data?.message || 'Gagal mengubah status akun pengguna.',
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    if (!currentUser?.isSuperAdmin?.() && currentUser?.role !== 'SuperAdmin') {
        return (
            <div className="max-w-md mx-auto py-16 text-center animate-in fade-in duration-300">
                <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">Akses Ditolak</h3>
                <p className="text-xs text-slate-500 mt-1">
                    Modul ini dilindungi middleware dan hanya dapat diakses oleh akun dengan role <strong>Super Admin</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-violet-700 text-xs font-bold uppercase tracking-wider mb-1">
                        <Shield className="w-4 h-4" />
                        <span>Super Admin — User Management (LDAP Integrated)</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Manajemen Pengguna & Hak Akses
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola role dan status akses civitas kampus. Seluruh akun terautentikasi melalui Direktori LDAP YARSI.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => loadUsers(pagination.current_page)}
                        className="p-2.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-bold"
                        title="Segarkan Data"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Banner Informasi Keamanan Sinkronisasi LDAP */}
            <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-slate-50 border border-violet-200/80 rounded-2xl p-4 flex items-start space-x-3 text-xs">
                <Info className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold text-violet-900">
                        Keamanan & Kebijakan Data Akun Civitas (Single Source of Truth)
                    </p>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                        Profil utama civitas (Nama Lengkap, NIP/NPM, Email, dan Unit Kerja) terikat langsung dengan Direktori LDAP Universitas YARSI dan bersifat <strong>Read-Only</strong> untuk menjaga integritas data. Superadmin berwenang mengubah <strong>Role</strong> dan melakukan <strong>Aktivasi/Nonaktivasi</strong> akun.
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari berdasarkan nama, NIP/NPM, username, atau email..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Role */}
                <div className="w-full sm:w-48">
                    <CustomSelect
                        value={filterRole}
                        onChange={(val) => setFilterRole(val)}
                        options={[
                            { value: '', label: 'Semua Role' },
                            { value: 'SuperAdmin', label: 'SuperAdmin', colorDot: 'bg-violet-500' },
                            { value: 'Tata Usaha', label: 'Tata Usaha', colorDot: 'bg-blue-500' },
                            { value: 'PIC', label: 'PIC Layanan', colorDot: 'bg-green-500' },
                            { value: 'User', label: 'User Biasa', colorDot: 'bg-slate-400' },
                        ]}
                        placeholder="Filter Role"
                    />
                </div>

                {/* Filter Status */}
                <div className="w-full sm:w-44">
                    <CustomSelect
                        value={filterStatus}
                        onChange={(val) => setFilterStatus(val)}
                        options={[
                            { value: '', label: 'Semua Status' },
                            { value: 'active', label: 'Akun Aktif', colorDot: 'bg-emerald-500' },
                            { value: 'inactive', label: 'Akun Nonaktif', colorDot: 'bg-rose-500' },
                        ]}
                        placeholder="Filter Status"
                    />
                </div>
            </div>

            {/* User Table Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-violet-600" />
                        <span className="text-sm font-bold text-slate-800">Daftar Pengguna Kampus</span>
                        <span className="text-xs text-slate-500 font-medium">
                            ({pagination.total} total akun)
                        </span>
                    </div>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                        Maksimal 10 baris per halaman
                    </span>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-3" />
                        <p className="text-xs text-slate-500 font-bold">Memuat data pengguna LDAP...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                                    <th className="text-left px-5 py-3.5">Pengguna & Akun LDAP</th>
                                    <th className="text-left px-4 py-3.5">Unit Kerja / Fakultas</th>
                                    <th className="text-left px-4 py-3.5">Role Saat Ini</th>
                                    <th className="text-left px-4 py-3.5">Status Akses</th>
                                    <th className="text-right px-5 py-3.5">Aksi Superadmin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((u) => {
                                    const isSelf = currentUser && u.id === currentUser.id;
                                    const isLoadingRow = actionLoadingId === u.id;

                                    return (
                                        <tr
                                            key={u.id}
                                            className={`hover:bg-slate-50/80 transition-colors ${
                                                !u.is_active ? 'bg-slate-50/40 opacity-75' : ''
                                            }`}
                                        >
                                            {/* Pengguna & Akun LDAP (Read-Only) */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                                                        u.is_active ? 'bg-violet-100 text-violet-800' : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                        {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <p className="font-bold text-slate-900 leading-tight">
                                                                {u.name}
                                                            </p>
                                                            {isSelf && (
                                                                <span className="text-[9px] font-black px-1.5 py-0.2 bg-violet-100 text-violet-700 rounded-md">
                                                                    Anda
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-medium">
                                                            NIP/NPM: <span className="font-mono text-slate-700">{u.username}</span>
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Unit Kerja */}
                                            <td className="px-4 py-3.5 text-slate-600 font-medium">
                                                {u.unit_kerja || '-'}
                                            </td>

                                            {/* Role */}
                                            <td className="px-4 py-3.5">
                                                <div className="space-y-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                                                        roleBadgeColor[u.role] || 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {u.role === 'SuperAdmin' ? 'Super Admin' : u.role}
                                                    </span>
                                                    {u.role === 'PIC' && u.pic_service_code && (
                                                        <div>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                                serviceBadgeColor[u.pic_service_code] || 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                                <Briefcase className="w-3 h-3" />
                                                                <span>{u.pic_service?.name || `Layanan [${u.pic_service_code}]`}</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Akun */}
                                            <td className="px-4 py-3.5">
                                                {u.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span>Aktif</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                        <span>Nonaktif</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Aksi Superadmin */}
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {/* Tombol Ubah Role */}
                                                    <button
                                                        onClick={() => setSelectedUserForRole(u)}
                                                        disabled={isSelf}
                                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                                                            isSelf
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
                                                        }`}
                                                        title={isSelf ? 'Tidak dapat mengubah role sendiri' : 'Ubah Role Pengguna'}
                                                    >
                                                        <Shield className="w-3.5 h-3.5" />
                                                        <span>Ubah Role</span>
                                                    </button>

                                                    {/* Tombol Toggle Status */}
                                                    <button
                                                        onClick={() => handleToggleStatus(u)}
                                                        disabled={isSelf || isLoadingRow || (u.role === 'SuperAdmin' && u.is_active)}
                                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                                                            isSelf || (u.role === 'SuperAdmin' && u.is_active)
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                : u.is_active
                                                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                        }`}
                                                        title={
                                                            isSelf
                                                                ? 'Tidak dapat menonaktifkan akun sendiri'
                                                                : u.is_active
                                                                    ? 'Klik untuk menonaktifkan akun'
                                                                    : 'Klik untuk mengaktifkan akun'
                                                        }
                                                    >
                                                        {isLoadingRow ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Power className="w-3.5 h-3.5" />
                                                        )}
                                                        <span>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-16 text-center text-slate-400">
                                            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs font-bold text-slate-600">Tidak ada data pengguna ditemukan.</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Coba periksa kata kunci pencarian atau sesuaikan filter role dan status.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer (Max 10 baris per halaman) */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500 font-medium">
                        Menampilkan <strong className="text-slate-800">{pagination.from || 0}</strong> - <strong className="text-slate-800">{pagination.to || 0}</strong> dari <strong className="text-slate-800">{pagination.total}</strong> akun
                    </div>

                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => loadUsers(pagination.current_page - 1)}
                            disabled={pagination.current_page <= 1 || loading}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Sebelumnya</span>
                        </button>

                        <div className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl">
                            {pagination.current_page} / {pagination.last_page || 1}
                        </div>

                        <button
                            onClick={() => loadUsers(pagination.current_page + 1)}
                            disabled={pagination.current_page >= pagination.last_page || loading}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                            <span>Selanjutnya</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Ubah Role */}
            {selectedUserForRole && (
                <ChangeRoleModal
                    user={selectedUserForRole}
                    onClose={() => setSelectedUserForRole(null)}
                    onUpdated={() => loadUsers(pagination.current_page)}
                />
            )}
        </div>
    );
}

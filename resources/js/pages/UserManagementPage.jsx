import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Users, Shield, UserCheck, UserX, Plus, Trash2,
    ChevronDown, Check, ShieldAlert, Loader2, RefreshCw,
    Briefcase, AlertCircle, X
} from 'lucide-react';

const SERVICES = [
    { code: 'D', name: 'Layanan Desain Grafis', color: 'indigo' },
    { code: 'P', name: 'Layanan Publikasi Website & Social Media', color: 'sky' },
    { code: 'S', name: 'Layanan Permohonan Alat Promosi', color: 'amber' },
    { code: 'M', name: 'Layanan Multimedia, Dokumentasi, & Live Streaming', color: 'emerald' },
    { code: 'L', name: 'Layanan Liputan & Berita', color: 'rose' },
];

const roleColor = {
    SuperAdmin: 'bg-violet-100 text-violet-700 border-violet-200',
    Admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    PIC: 'bg-green-100 text-green-700 border-green-200',
    User: 'bg-slate-100 text-slate-700 border-slate-200',
};

const serviceColor = {
    D: 'bg-indigo-50 text-indigo-700',
    P: 'bg-sky-50 text-sky-700',
    S: 'bg-amber-50 text-amber-700',
    M: 'bg-emerald-50 text-emerald-700',
    L: 'bg-rose-50 text-rose-700',
};

function AssignPicModal({ user, onClose, onAssigned }) {
    const [selectedService, setSelectedService] = useState(user.pic_service_code || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await api.patch(`/users/${user.id}/assign-pic`, {
                service_code: selectedService || null,
            });
            if (res.data?.status === 'success') {
                onAssigned(res.data.message);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menetapkan PIC.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Tetapkan PIC Layanan</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Untuk: <strong>{user.name}</strong></p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            Pilih Layanan (kosongkan untuk hapus PIC)
                        </label>
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setSelectedService('')}
                                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                                    selectedService === ''
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Tidak ada (Role: User biasa)</span>
                                </div>
                            </button>
                            {SERVICES.map(svc => (
                                <button
                                    key={svc.code}
                                    type="button"
                                    onClick={() => setSelectedService(svc.code)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                                        selectedService === svc.code
                                            ? 'bg-green-600 text-white border-green-600'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{svc.name}</span>
                                        {selectedService === svc.code && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddUserModal({ onClose, onAdded }) {
    const [form, setForm] = useState({ name: '', username: '', email: '', unit_kerja: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/users', form);
            if (res.data?.status === 'success') {
                onAdded(res.data.message);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {}).flat().join(', ') || 'Gagal membuat akun.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Tambah Pengguna Baru</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Role default: User (bisa diatur sebagai PIC)</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    {[
                        { key: 'name', label: 'Nama Lengkap', placeholder: 'Nama pengguna', required: true },
                        { key: 'username', label: 'Username', placeholder: 'username unik', required: true },
                        { key: 'email', label: 'Email', placeholder: 'email@kampus.ac.id', type: 'email', required: true },
                        { key: 'unit_kerja', label: 'Unit Kerja', placeholder: 'Divisi/Biro/Fakultas', required: false },
                        { key: 'password', label: 'Password', placeholder: 'Min. 6 karakter', type: 'password', required: true },
                    ].map(field => (
                        <div key={field.key}>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{field.label} {field.required && <span className="text-rose-500">*</span>}</label>
                            <input
                                type={field.type || 'text'}
                                value={form[field.key]}
                                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                required={field.required}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                    ))}

                    <div className="flex justify-end space-x-2 pt-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{loading ? 'Membuat...' : 'Buat Akun'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UserManagementPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [assignModal, setAssignModal] = useState(null);
    const [addModal, setAddModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [filterRole, setFilterRole] = useState('');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            if (res.data?.status === 'success') {
                setUsers(res.data.data);
            }
        } catch (err) {
            showToast('Gagal memuat data pengguna.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (u) => {
        if (!confirm(`Hapus akun "${u.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
        setDeletingId(u.id);
        try {
            const res = await api.delete(`/users/${u.id}`);
            if (res.data?.status === 'success') {
                showToast(res.data.message);
                loadUsers();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Gagal menghapus akun.', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    if (!user?.isSuperAdmin?.()) {
        return (
            <div className="max-w-md mx-auto py-16 text-center">
                <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800">Akses Ditolak</h3>
                <p className="text-xs text-slate-500 mt-1">Halaman ini hanya dapat diakses oleh Super Admin.</p>
            </div>
        );
    }

    const filteredUsers = filterRole
        ? users.filter(u => u.role === filterRole)
        : users;

    const picByService = {};
    SERVICES.forEach(svc => {
        picByService[svc.code] = users.filter(u => u.pic_service_code === svc.code && u.role === 'PIC');
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold animate-in slide-in-from-right duration-300 ${
                    toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-green-600 text-white'
                }`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-violet-700 text-xs font-bold uppercase tracking-wider mb-1">
                        <Shield className="w-4 h-4" />
                        <span>Super Admin — Kelola Pengguna</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Manajemen Pengguna & PIC Layanan
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Tetapkan pengguna sebagai PIC di setiap layanan. Role mereka akan diperbarui otomatis.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={loadUsers}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setAddModal(true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Pengguna</span>
                    </button>
                </div>
            </div>

            {/* PIC per Service Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {SERVICES.map(svc => {
                    const pics = picByService[svc.code] || [];
                    return (
                        <div key={svc.code} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                            <div className="flex items-start justify-between mb-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${serviceColor[svc.code]}`}>
                                    {svc.code}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pics.length > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {pics.length > 0 ? `${pics.length} PIC` : 'Kosong'}
                                </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-800 leading-tight mb-1">{svc.name}</p>
                            {pics.length > 0 ? (
                                <p className="text-[10px] text-slate-600 truncate">{pics.map(p => p.name).join(', ')}</p>
                            ) : (
                                <p className="text-[10px] text-slate-400 italic">Belum ada PIC</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* User Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-800">Daftar Pengguna</span>
                        <span className="text-xs text-slate-500">({filteredUsers.length} dari {users.length})</span>
                    </div>
                    <div className="ml-auto flex items-center space-x-2">
                        <select
                            value={filterRole}
                            onChange={e => setFilterRole(e.target.value)}
                            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-none"
                        >
                            <option value="">Semua Role</option>
                            <option value="SuperAdmin">SuperAdmin</option>
                            <option value="Admin">Admin</option>
                            <option value="PIC">PIC</option>
                            <option value="User">User</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-3" />
                        <p className="text-xs text-slate-400 font-bold">Memuat data pengguna...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Pengguna</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Unit Kerja</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Role</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">PIC Layanan</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{u.name}</p>
                                                    <p className="text-[10px] text-slate-400">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{u.unit_kerja || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${roleColor[u.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {u.pic_service_code ? (
                                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${serviceColor[u.pic_service_code]}`}>
                                                    <Briefcase className="w-3 h-3" />
                                                    <span>{u.pic_service ? u.pic_service.name : `[${u.pic_service_code}]`}</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {u.role !== 'SuperAdmin' && (
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => setAssignModal(u)}
                                                        className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-colors"
                                                    >
                                                        <UserCheck className="w-3 h-3" />
                                                        <span>Atur PIC</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u)}
                                                        disabled={deletingId === u.id}
                                                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Hapus akun"
                                                    >
                                                        {deletingId === u.id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <Trash2 className="w-3.5 h-3.5" />
                                                        }
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                                            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs font-medium">Tidak ada pengguna ditemukan.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {assignModal && (
                <AssignPicModal
                    user={assignModal}
                    onClose={() => setAssignModal(null)}
                    onAssigned={(msg) => { showToast(msg); loadUsers(); }}
                />
            )}
            {addModal && (
                <AddUserModal
                    onClose={() => setAddModal(false)}
                    onAdded={(msg) => { showToast(msg); loadUsers(); }}
                />
            )}
        </div>
    );
}

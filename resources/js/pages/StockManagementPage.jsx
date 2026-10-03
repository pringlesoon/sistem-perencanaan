import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Package,
    Plus,
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    AlertTriangle,
    CheckCircle2,
    Wrench,
    Camera,
    RefreshCw,
    FileText,
    Boxes,
    Tag,
    X,
    Filter
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function StockManagementPage({ initialTab = 'suvenir' }) {
    const { user } = useAuth();
    const picCode = user?.pic_service_code;
    const isPicS = user?.role === 'PIC' && picCode === 'S';
    const isPicM = user?.role === 'PIC' && picCode === 'M';
    const isAdmin = ['Admin', 'SuperAdmin'].includes(user?.role);

    // Default tab: if PIC M, default to multimedia, else suvenir
    const [activeCategory, setActiveCategory] = useState(
        isPicM ? 'multimedia' : (initialTab || 'suvenir')
    );
    const [viewLogs, setViewLogs] = useState(false);

    const [items, setItems] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [conditionFilter, setConditionFilter] = useState('');

    // Modal Add Item
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        nama_item: '',
        stok_tersedia: 10,
        satuan: 'pcs',
        deskripsi: '',
        kategori: activeCategory,
        kondisi: 'Bagus/Oke',
    });
    const [submittingAdd, setSubmittingAdd] = useState(false);

    // Modal Adjust Stock
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [adjustData, setAdjustData] = useState({
        tipe: 'Masuk',
        jumlah: 10,
        catatan: '',
    });
    const [submittingAdjust, setSubmittingAdjust] = useState(false);

    // Alert feedback
    const [feedback, setFeedback] = useState(null);

    const loadItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('kategori', activeCategory);
            if (searchTerm) params.append('search', searchTerm);
            if (conditionFilter) params.append('kondisi', conditionFilter);

            const res = await api.get(`/inventory?${params.toString()}`);
            if (res.data?.status === 'success') {
                setItems(res.data.data || []);
            }
        } catch (err) {
            console.error('Error loading inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        try {
            const params = new URLSearchParams();
            if (activeCategory) params.append('kategori', activeCategory);
            const res = await api.get(`/inventory-logs?${params.toString()}`);
            if (res.data?.status === 'success') {
                setLogs(res.data.data?.data || []);
            }
        } catch (err) {
            console.error('Error loading logs:', err);
        }
    };

    useEffect(() => {
        loadItems();
        if (viewLogs) {
            loadLogs();
        }
    }, [activeCategory, searchTerm, conditionFilter, viewLogs]);

    const handleAddItem = async (e) => {
        e.preventDefault();
        setSubmittingAdd(true);
        try {
            const res = await api.post('/inventory', {
                ...newItem,
                kategori: activeCategory,
            });
            if (res.data?.status === 'success') {
                setFeedback({ type: 'success', message: 'Item inventaris baru berhasil ditambahkan.' });
                setShowAddModal(false);
                setNewItem({
                    nama_item: '',
                    stok_tersedia: 10,
                    satuan: activeCategory === 'suvenir' ? 'pcs' : 'unit',
                    deskripsi: '',
                    kategori: activeCategory,
                    kondisi: 'Bagus/Oke',
                });
                loadItems();
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal menambahkan item.' });
        } finally {
            setSubmittingAdd(false);
        }
    };

    const handleAdjustStock = async (e) => {
        e.preventDefault();
        if (!adjustData.catatan.trim()) {
            alert('Kolom catatan wajib diisi untuk penyesuaian stok.');
            return;
        }

        setSubmittingAdjust(true);
        try {
            const res = await api.post(`/inventory/${selectedItem.id}/adjust`, adjustData);
            if (res.data?.status === 'success') {
                setFeedback({ type: 'success', message: res.data.message });
                setShowAdjustModal(false);
                setAdjustData({ tipe: 'Masuk', jumlah: 10, catatan: '' });
                loadItems();
                if (viewLogs) loadLogs();
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal menyesuaikan stok.' });
        } finally {
            setSubmittingAdjust(false);
        }
    };

    const handleUpdateCondition = async (item, newCondition) => {
        try {
            const res = await api.put(`/inventory/${item.id}`, {
                kondisi: newCondition,
            });
            if (res.data?.status === 'success') {
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, kondisi: newCondition } : i));
                setFeedback({ type: 'success', message: `Kondisi ${item.nama_item} diubah menjadi ${newCondition}.` });
            }
        } catch (err) {
            alert('Gagal memperbarui kondisi alat.');
        }
    };

    const conditionBadgeStyle = (kondisi) => {
        switch (kondisi) {
            case 'Bagus/Oke':
            case 'Bagus':
            case 'Oke':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Sedang Diperbaiki':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Rusak':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'Hilang':
                return 'bg-slate-100 text-slate-700 border-slate-300';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                        {activeCategory === 'suvenir' ? <Package className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                        <span>{activeCategory === 'suvenir' ? 'Manajemen Stok Suvenir' : 'Inventaris Peralatan Multimedia'}</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {activeCategory === 'suvenir' ? 'Inventaris & Log Suvenir' : 'Daftar Alat & Kondisi Multimedia'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {activeCategory === 'suvenir'
                            ? 'Pantau stok riil suvenir, mutasi masuk/keluar otomatis, dan alokasi persetujuan pemohon.'
                            : 'Pendataan inventaris studio, kamera, lighting, serta pemantauan label kondisi alat secara berkala.'}
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewLogs(!viewLogs)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 cursor-pointer ${
                            viewLogs ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" />
                        <span>{viewLogs ? 'Tutup Riwayat Log' : 'Lihat Log Mutasi'}</span>
                    </button>

                    {(isAdmin || isPicS || isPicM) && (
                        <button
                            onClick={() => {
                                setNewItem({
                                    nama_item: '',
                                    stok_tersedia: activeCategory === 'suvenir' ? 20 : 1,
                                    satuan: activeCategory === 'suvenir' ? 'pcs' : 'unit',
                                    deskripsi: '',
                                    kategori: activeCategory,
                                    kondisi: 'Bagus/Oke',
                                });
                                setShowAddModal(true);
                            }}
                            className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Item</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Category Tabs (shown for Admin / SuperAdmin, or if not locked) */}
            {isAdmin && (
                <div className="flex space-x-2 border-b border-slate-200">
                    <button
                        onClick={() => { setActiveCategory('suvenir'); setConditionFilter(''); }}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                            activeCategory === 'suvenir'
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Package className="w-4 h-4 inline mr-1.5" />
                        Stok Suvenir (Alat Promosi)
                    </button>
                    <button
                        onClick={() => { setActiveCategory('multimedia'); setConditionFilter(''); }}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                            activeCategory === 'multimedia'
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Camera className="w-4 h-4 inline mr-1.5" />
                        Inventaris Alat Multimedia
                    </button>
                </div>
            )}

            {/* Feedback message */}
            {feedback && (
                <div className={`p-3.5 rounded-2xl text-xs flex items-center justify-between ${
                    feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                    <div className="flex items-center space-x-2">
                        {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Cari nama barang atau deskripsi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none"
                    />
                </div>

                {activeCategory === 'multimedia' && (
                    <div className="flex items-center space-x-2">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <CustomSelect
                            value={conditionFilter}
                            onChange={(val) => setConditionFilter(val)}
                            options={[
                                { value: '', label: 'Semua Kondisi' },
                                { value: 'Bagus/Oke', label: 'Bagus / Oke', colorDot: 'bg-emerald-500' },
                                { value: 'Sedang Diperbaiki', label: 'Sedang Diperbaiki', colorDot: 'bg-amber-500' },
                                { value: 'Rusak', label: 'Rusak', colorDot: 'bg-rose-500' },
                                { value: 'Hilang', label: 'Hilang', colorDot: 'bg-slate-400' },
                            ]}
                            placeholder="Semua Kondisi"
                        />
                    </div>
                )}

                <button
                    onClick={loadItems}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Muat ulang"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Content Display: Logs or Main Table */}
            {viewLogs ? (
                /* INVENTORY LOGS VIEW */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                            <History className="w-4 h-4 text-indigo-600" />
                            <span>Riwayat Log Keluar / Masuk Inventaris</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Tercatat Otomatis</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Waktu</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Item</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Tipe Mutasi</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Jumlah</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Keterangan / Tiket</th>
                                    <th className="text-left px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Petugas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-slate-400">
                                            Belum ada catatan log mutasi inventaris.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-800">
                                                {log.item?.nama_item || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    log.tipe === 'Masuk' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {log.tipe === 'Masuk' ? <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> : <ArrowUpRight className="w-3 h-3 text-amber-600" />}
                                                    <span>{log.tipe}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-extrabold text-slate-900">
                                                {log.tipe === 'Masuk' ? `+${log.jumlah}` : `-${log.jumlah}`} {log.item?.satuan || ''}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {log.catatan}
                                                {log.permohonan && (
                                                    <span className="block font-mono text-[10px] text-indigo-600 mt-0.5">
                                                        Tiket: {log.permohonan.nomor_tiket}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {log.user?.name || 'Sistem'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* MAIN ITEMS TABLE */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px]">Nama Barang / Item</th>
                                    <th className="text-left px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px]">Deskripsi & Spesifikasi</th>
                                    <th className="text-center px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px]">Stok Tersedia</th>
                                    {activeCategory === 'multimedia' && (
                                        <th className="text-left px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px]">Kondisi Alat</th>
                                    )}
                                    <th className="text-right px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px]">Aksi & Pengaturan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={activeCategory === 'multimedia' ? 5 : 4} className="text-center py-14 text-slate-400">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                                            <p className="font-semibold text-xs">Memuat data inventaris...</p>
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeCategory === 'multimedia' ? 5 : 4} className="text-center py-14 text-slate-400">
                                            <Boxes className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="font-bold text-xs text-slate-600">Tidak ada barang inventaris</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Silakan tambahkan data inventaris baru melalui tombol Tambah Item.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center space-x-2.5">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                        activeCategory === 'suvenir' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {activeCategory === 'suvenir' ? <Package className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 text-xs block leading-tight">{item.nama_item}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">Satuan: {item.satuan}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-600 max-w-xs">
                                                <p className="line-clamp-2 text-[11px] leading-relaxed">{item.deskripsi || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black border ${
                                                    item.stok_tersedia > 20
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : item.stok_tersedia > 0
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}>
                                                    {item.stok_tersedia} <span className="font-medium text-[10px]">{item.satuan}</span>
                                                </span>
                                            </td>
                                            {activeCategory === 'multimedia' && (
                                                <td className="px-4 py-3.5">
                                                    {(isAdmin || isPicM) ? (
                                                        <CustomSelect
                                                            value={item.kondisi || 'Bagus/Oke'}
                                                            onChange={(val) => handleUpdateCondition(item, val)}
                                                            options={[
                                                                { value: 'Bagus/Oke', label: 'Bagus / Oke', colorDot: 'bg-emerald-500' },
                                                                { value: 'Sedang Diperbaiki', label: 'Sedang Diperbaiki', colorDot: 'bg-amber-500' },
                                                                { value: 'Rusak', label: 'Rusak', colorDot: 'bg-rose-500' },
                                                                { value: 'Hilang', label: 'Hilang', colorDot: 'bg-slate-400' },
                                                            ]}
                                                            placeholder="Pilih Kondisi"
                                                            className={`py-1 px-2.5 text-xs font-bold ${conditionBadgeStyle(item.kondisi)}`}
                                                        />
                                                    ) : (
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${conditionBadgeStyle(item.kondisi)}`}>
                                                            {item.kondisi || 'Bagus/Oke'}
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-4 py-3.5 text-right">
                                                {(isAdmin || isPicS || isPicM) && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setAdjustData({ tipe: 'Masuk', jumlah: 10, catatan: '' });
                                                            setShowAdjustModal(true);
                                                        }}
                                                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                                        title="Sesuaikan stok barang"
                                                    >
                                                        <Wrench className="w-3 h-3" />
                                                        <span>Sesuaikan Stok</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Tambah Item Baru */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                                <Plus className="w-4 h-4 text-green-600" />
                                <span>Tambah Item {activeCategory === 'suvenir' ? 'Suvenir' : 'Peralatan Multimedia'}</span>
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Nama Barang / Peralatan *</label>
                                <input
                                    type="text"
                                    required
                                    value={newItem.nama_item}
                                    onChange={(e) => setNewItem({ ...newItem, nama_item: e.target.value })}
                                    placeholder={activeCategory === 'suvenir' ? 'Contoh: Tumbler Custom Logo Kampus' : 'Contoh: Mic Wireless Handheld Shure'}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Stok Awal *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={newItem.stok_tersedia}
                                        onChange={(e) => setNewItem({ ...newItem, stok_tersedia: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Satuan *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newItem.satuan}
                                        onChange={(e) => setNewItem({ ...newItem, satuan: e.target.value })}
                                        placeholder="pcs, unit, set, buah..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>

                            {activeCategory === 'multimedia' && (
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Kondisi Alat *</label>
                                    <CustomSelect
                                        value={newItem.kondisi}
                                        onChange={(val) => setNewItem({ ...newItem, kondisi: val })}
                                        options={[
                                            { value: 'Bagus/Oke', label: 'Bagus / Oke', colorDot: 'bg-emerald-500' },
                                            { value: 'Sedang Diperbaiki', label: 'Sedang Diperbaiki', colorDot: 'bg-amber-500' },
                                            { value: 'Rusak', label: 'Rusak', colorDot: 'bg-rose-500' },
                                            { value: 'Hilang', label: 'Hilang', colorDot: 'bg-slate-400' },
                                        ]}
                                        placeholder="Pilih Kondisi"
                                        fullWidth
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Deskripsi & Keterangan</label>
                                <textarea
                                    rows={2}
                                    value={newItem.deskripsi}
                                    onChange={(e) => setNewItem({ ...newItem, deskripsi: e.target.value })}
                                    placeholder="Spesifikasi, lokasi penyimpanan, atau catatan khusus..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAdd}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer"
                                >
                                    {submittingAdd ? 'Menyimpan...' : 'Simpan Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Sesuaikan Stok (Masuk / Keluar) */}
            {showAdjustModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                                    <Wrench className="w-4 h-4 text-indigo-600" />
                                    <span>Penyesuaian Stok Barang</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-bold">{selectedItem.nama_item}</p>
                            </div>
                            <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                            <span className="text-slate-500 font-bold">Stok Saat Ini:</span>
                            <span className="text-sm font-black text-indigo-700">{selectedItem.stok_tersedia} {selectedItem.satuan}</span>
                        </div>

                        <form onSubmit={handleAdjustStock} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Aksi Penyesuaian</label>
                                    <CustomSelect
                                        value={adjustData.tipe}
                                        onChange={(val) => setAdjustData({ ...adjustData, tipe: val })}
                                        options={[
                                            { value: 'Masuk', label: 'Stok Masuk (+)', colorDot: 'bg-emerald-500' },
                                            { value: 'Keluar', label: 'Stok Keluar (-)', colorDot: 'bg-rose-500' },
                                        ]}
                                        placeholder="Pilih Aksi"
                                        fullWidth
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Jumlah</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={adjustData.jumlah}
                                        onChange={(e) => setAdjustData({ ...adjustData, jumlah: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Catatan / Alasan Mutasi <span className="text-rose-500">* (Wajib Diisi)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={adjustData.catatan}
                                    onChange={(e) => setAdjustData({ ...adjustData, catatan: e.target.value })}
                                    placeholder="Contoh: Pengadaan batch baru dari vendor / Pembagian souvenir wisuda VIP..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAdjust}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer"
                                >
                                    {submittingAdjust ? 'Menyimpan...' : 'Simpan Mutasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

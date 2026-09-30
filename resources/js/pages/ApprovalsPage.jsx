import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CheckSquare, CheckCircle, XCircle, Clock, PackageCheck, AlertCircle, Sparkles, SlidersHorizontal, X } from 'lucide-react';

export default function ApprovalsPage({ onOpenTracking }) {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReq, setSelectedReq] = useState(null);
    const [decisionMode, setDecisionMode] = useState('approve'); // 'approve', 'partial', 'reject'
    const [partialQty, setPartialQty] = useState('');
    const [catatan, setCatatan] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const loadPendingApprovals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/requests?status=Menunggu%20Approval%20Sebagian');
            if (res.data?.status === 'success') {
                setPendingRequests(res.data.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching approvals:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPendingApprovals();
    }, []);

    const openDecisionModal = (req, defaultDecision = 'approve') => {
        setSelectedReq(req);
        setDecisionMode(defaultDecision);
        const suvenir = req.suvenir_detail;
        const defaultPartial = suvenir ? Math.min(suvenir.qty_diminta, Math.max(1, suvenir.qty_disetujui_otomatis || Math.floor(suvenir.qty_diminta / 2))) : 1;
        setPartialQty(defaultPartial.toString());
        setCatatan(
            defaultDecision === 'approve'
                ? 'Disetujui penuh sesuai permohonan.'
                : defaultDecision === 'partial'
                ? `Disetujui sebagian (${defaultPartial} unit) karena penyesuaian ketersediaan stok inventaris.`
                : 'Alokasi kuota melebihi kapasitas stok saat ini.'
        );
        setErrorMessage('');
    };

    const handleDecisionSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReq) return;

        if (!catatan.trim()) {
            setErrorMessage('Kolom catatan wajib diisi agar pemohon memahami alasan keputusan.');
            return;
        }

        const payload = {
            decision: decisionMode,
            catatan: catatan.trim(),
        };

        if (decisionMode === 'partial') {
            const qty = parseInt(partialQty, 10);
            if (isNaN(qty) || qty <= 0) {
                setErrorMessage('Jumlah unit yang disetujui harus berupa angka lebih dari 0.');
                return;
            }
            if (selectedReq.suvenir_detail && qty > selectedReq.suvenir_detail.qty_diminta) {
                setErrorMessage(`Jumlah tidak boleh melebihi total permintaan (${selectedReq.suvenir_detail.qty_diminta} unit).`);
                return;
            }
            payload.qty_disetujui = qty;
        }

        setProcessing(true);
        setErrorMessage('');
        try {
            const res = await api.post(`/requests/${selectedReq.id}/approve`, payload);
            if (res.data?.status === 'success') {
                setSelectedReq(null);
                loadPendingApprovals();
            } else {
                setErrorMessage(res.data?.message || 'Gagal memproses persetujuan.');
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Gagal memproses persetujuan.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center space-x-2 text-violet-700 text-xs font-bold uppercase tracking-wider mb-1">
                    <CheckSquare className="w-4 h-4" />
                    <span>Otorisasi Kuota Permohonan</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Antrean Persetujuan Kuota Layanan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Permohonan yang melewati batas auto-approval (seperti Suvenir &gt; 20 unit) membutuhkan pertimbangan dan keputusan Anda (Persetujuan Penuh, Persetujuan Sebagian, atau Penolakan).
                </p>
            </div>

            {loading ? (
                <div className="py-16 text-center">
                    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-bold">Memuat antrean approval...</p>
                </div>
            ) : pendingRequests.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">Semua Antrean Bersih!</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Saat ini tidak ada permohonan yang menunggu persetujuan kuota dari Anda.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingRequests.map(req => {
                        const suvenir = req.suvenir_detail;

                        return (
                            <div
                                key={req.id}
                                className="bg-white rounded-3xl border border-amber-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                                {req.nomor_tiket}
                                            </span>
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                Menunggu Otorisasi
                                            </span>
                                        </div>
                                        <h3 className="font-black text-base text-slate-900 mt-2">
                                            {req.judul_permohonan}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Pemohon: <strong>{req.user?.name}</strong> • {req.user?.unit_kerja}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                                    {req.deskripsi_kebutuhan}
                                </p>

                                {suvenir && (
                                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs space-y-2">
                                        <p className="font-bold text-amber-900 flex items-center space-x-1.5">
                                            <PackageCheck className="w-4 h-4 text-amber-600" />
                                            <span>Rincian Kuota Suvenir: <strong>{suvenir.nama_item}</strong></span>
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                            <div className="p-2 bg-white rounded-xl border border-amber-200">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Diminta</p>
                                                <p className="text-base font-black text-slate-900">{suvenir.qty_diminta}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-xl border border-emerald-200">
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase">Auto-Approve</p>
                                                <p className="text-base font-black text-emerald-700">{suvenir.qty_disetujui_otomatis}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-xl border border-rose-200">
                                                <p className="text-[10px] text-rose-600 font-bold uppercase">Perlu Otorisasi</p>
                                                <p className="text-base font-black text-rose-700">{suvenir.qty_perlu_approval}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                                    <button
                                        onClick={() => openDecisionModal(req, 'reject')}
                                        className="px-3.5 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Tolak</span>
                                    </button>
                                    <button
                                        onClick={() => openDecisionModal(req, 'partial')}
                                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                        <span>Setujui Sebagian</span>
                                    </button>
                                    <button
                                        onClick={() => openDecisionModal(req, 'approve')}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Setujui Penuh</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Keputusan Persetujuan */}
            {selectedReq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <span className="font-mono text-[11px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                    {selectedReq.nomor_tiket}
                                </span>
                                <h3 className="font-black text-slate-900 text-lg mt-1">Keputusan Persetujuan Kuota</h3>
                            </div>
                            <button
                                onClick={() => setSelectedReq(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleDecisionSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Tentukan Bentuk Keputusan:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDecisionMode('approve');
                                            setCatatan('Disetujui penuh sesuai permohonan.');
                                        }}
                                        className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                            decisionMode === 'approve'
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <CheckCircle className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                                        <span>Setujui Penuh</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDecisionMode('partial');
                                            const defQty = Math.min(selectedReq.suvenir_detail?.qty_diminta || 20, 20);
                                            setCatatan(`Disetujui sebagian (${defQty} unit) karena pertimbangan efisiensi stok.`);
                                        }}
                                        className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                            decisionMode === 'partial'
                                                ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-300'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <SlidersHorizontal className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                                        <span>Setujui Sebagian</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDecisionMode('reject');
                                            setCatatan('Permintaan kuota suvenir ditolak karena keterbatasan alokasi stok.');
                                        }}
                                        className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                            decisionMode === 'reject'
                                                ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-300'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <XCircle className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                                        <span>Tolak</span>
                                    </button>
                                </div>
                            </div>

                            {decisionMode === 'partial' && (
                                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                                    <label className="text-xs font-bold text-amber-900 block">
                                        Total Kuota yang Disetujui (Unit):
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max={selectedReq.suvenir_detail?.qty_diminta || 1000}
                                            value={partialQty}
                                            onChange={(e) => {
                                                setPartialQty(e.target.value);
                                                setCatatan(`Disetujui sebagian (${e.target.value} unit) karena pertimbangan efisiensi stok.`);
                                            }}
                                            required
                                            className="w-32 px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                        />
                                        <span className="text-xs text-amber-700 font-medium">
                                            dari total <strong>{selectedReq.suvenir_detail?.qty_diminta}</strong> unit yang diminta
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-amber-700">
                                        *Stok di sistem inventaris akan terpotong sejumlah kuota yang Anda setujui ini.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>Catatan Keputusan <span className="text-rose-500">*wajib</span>:</span>
                                    <span className="text-[11px] text-slate-400 font-normal">Pemohon akan melihat catatan ini</span>
                                </label>
                                <textarea
                                    rows="3"
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    required
                                    placeholder="Tuliskan alasan atau keterangan keputusan Anda..."
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedReq(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : 'Konfirmasi Keputusan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

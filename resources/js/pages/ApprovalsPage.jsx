import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CheckSquare, CheckCircle, XCircle, Clock, PackageCheck, AlertCircle } from 'lucide-react';

export default function ApprovalsPage({ onOpenTracking }) {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

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

    const handleDecision = async (id, decision) => {
        const promptNote = prompt(
            `Masukkan catatan untuk keputusan ${decision === 'approve' ? 'persetujuan' : 'penolakan'}:`,
            decision === 'approve' ? 'Disetujui penuh oleh Kepala Divisi.' : 'Permintaan melebihi stok alokasi divisi.'
        );
        if (promptNote === null) return;

        setProcessingId(id);
        try {
            const res = await api.post(`/requests/${id}/approve`, {
                decision,
                catatan: promptNote,
            });

            if (res.data?.status === 'success') {
                loadPendingApprovals();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memproses persetujuan.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center space-x-2 text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">
                    <CheckSquare className="w-4 h-4" />
                    <span>Modul Otorisasi Kepala Divisi</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Antrean Persetujuan Kuota Layanan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Permohonan yang melewati batas auto-approval (seperti Suvenir &gt; 20 unit) membutuhkan pertimbangan dan verifikasi Anda.
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
                        const isProcessing = processingId === req.id;

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
                                                Menunggu Approval
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
                                                <p className="text-[10px] text-rose-600 font-bold uppercase">Perlu Kuota Anda</p>
                                                <p className="text-base font-black text-rose-700">{suvenir.qty_perlu_approval}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => handleDecision(req.id, 'reject')}
                                        className="px-4 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <XCircle className="w-4 h-4 text-rose-600" />
                                        <span>Tolak Sisa Kuota ({suvenir?.qty_perlu_approval})</span>
                                    </button>
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => handleDecision(req.id, 'approve')}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Setujui Sisa Kuota ({suvenir?.qty_perlu_approval})</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight, User, Paperclip, FileText, Download } from 'lucide-react';

const statusBadgeConfig = {
    'Diajukan': { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock, dot: 'bg-amber-500' },
    'Diproses': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Clock, dot: 'bg-blue-500' },
    'Terjadwalkan/Produksi Berita': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Clock, dot: 'bg-blue-500' },
    'Direvisi': { bg: 'bg-orange-50 text-orange-800 border-orange-200', icon: AlertTriangle, dot: 'bg-orange-500' },
    'Produksi/Pemeriksaan Konten': { bg: 'bg-sky-50 text-sky-800 border-sky-200', icon: Clock, dot: 'bg-sky-500' },
    'Proses Tayang': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Clock, dot: 'bg-blue-500' },
    'Pemeriksaan Konten': { bg: 'bg-sky-50 text-sky-800 border-sky-200', icon: Clock, dot: 'bg-sky-500' },
    'Publikasi': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Clock, dot: 'bg-blue-500' },
    'Menunggu Approval': { bg: 'bg-purple-50 text-purple-800 border-purple-200', icon: Clock, dot: 'bg-purple-500' },
    'Menunggu Approval Sebagian': { bg: 'bg-purple-50 text-purple-800 border-purple-200', icon: Clock, dot: 'bg-purple-500' },
    'Selesai': { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2, dot: 'bg-emerald-500' },
    'Ditolak': { bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle, dot: 'bg-rose-500' },
};

export default function StatusTimeline({ histories = [] }) {
    if (!histories || histories.length === 0) {
        return <p className="text-xs text-slate-400">Belum ada riwayat perubahan status.</p>;
    }

    return (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {histories.map((item, idx) => {
                const config = statusBadgeConfig[item.status_baru] || {
                    bg: 'bg-slate-50 text-slate-800 border-slate-200',
                    dot: 'bg-slate-400',
                };

                const dateObj = new Date(item.created_at);
                const formattedDate = dateObj.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
                const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                });

                return (
                    <div key={item.id || idx} className="relative group">
                        {/* Dot indicator */}
                        <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ring-slate-100 ${config.dot}`} />

                        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                            {/* Header: Status Transition & Timestamp */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center space-x-1.5 text-xs font-bold">
                                    {item.status_sebelumnya && (
                                        <>
                                            <span className="text-slate-500">{item.status_sebelumnya}</span>
                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                        </>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${config.bg}`}>
                                        {item.status_baru}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {formattedDate} • {formattedTime}
                                </span>
                            </div>

                            {/* Actor */}
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium mb-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>Diperbarui oleh: <strong>{item.user?.name || 'Sistem'}</strong></span>
                                {item.user?.role && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/60 font-semibold text-slate-600">
                                        {item.user.role}
                                    </span>
                                )}
                            </div>

                            {/* Note / Catatan Revisi */}
                            {item.catatan && (
                                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 mt-2 italic leading-relaxed">
                                    "{item.catatan}"
                                </p>
                            )}

                            {/* Berkas Lampiran Hasil Revisi / Pemeriksaan (Mendukung Multiple Attachments) */}
                            {(() => {
                                const revAttachments = (item.attachments && item.attachments.length > 0)
                                    ? item.attachments
                                    : (item.file_path ? [{
                                        id: item.id,
                                        file_name: item.file_name,
                                        file_path: item.file_path,
                                        file_size: item.file_size,
                                        clean_file_name: item.clean_file_name,
                                        download_url: item.download_url,
                                    }] : []);

                                if (revAttachments.length === 0) return null;

                                return (
                                    <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                                                <Paperclip className="w-3 h-3 text-indigo-500" />
                                                <span>Berkas Hasil Revisi / Pemeriksaan ({revAttachments.length}):</span>
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {revAttachments.map((att, attIdx) => (
                                                <a
                                                    key={att.id || attIdx}
                                                    href={att.download_url || `/api/v1/status-history-attachments/${att.id}/download`}
                                                    download={att.clean_file_name || att.file_name}
                                                    className="flex items-center justify-between p-2.5 bg-white hover:bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-700 font-semibold transition-all group/rev shadow-2xs hover:border-indigo-300"
                                                    title={`Unduh: ${att.clean_file_name || att.file_name}`}
                                                >
                                                    <div className="flex items-center space-x-2 truncate">
                                                        <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                                            <FileText className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="truncate">
                                                            <span className="truncate block font-bold text-slate-800 group-hover/rev:text-indigo-600">
                                                                {att.file_name?.startsWith('[Hasil Revisi]') ? att.file_name : `[Hasil Revisi] ${att.file_name}`}
                                                            </span>
                                                            {att.file_size && (
                                                                <span className="text-[10px] text-slate-400 font-normal">
                                                                    {(att.file_size / 1024).toFixed(0)} KB • Klik untuk mengunduh
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-1 shrink-0 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold group-hover/rev:bg-indigo-600 group-hover/rev:text-white transition-colors">
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span>Unduh</span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

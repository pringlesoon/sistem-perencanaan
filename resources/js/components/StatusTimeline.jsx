import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight, User } from 'lucide-react';

const statusBadgeConfig = {
    'Diajukan': { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock, dot: 'bg-amber-500' },
    'Diproses': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Clock, dot: 'bg-blue-500' },
    'Direvisi': { bg: 'bg-orange-50 text-orange-800 border-orange-200', icon: AlertTriangle, dot: 'bg-orange-500' },
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
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

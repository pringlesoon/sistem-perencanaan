import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import CustomSelect from './CustomSelect';

export default function DateTimePicker({
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    maxDurationMinutes = 180,
    onValidationChange
}) {
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [conflictError, setConflictError] = useState(null);
    const [durationError, setDurationError] = useState(null);
    const [durationText, setDurationText] = useState('');

    // Fetch availability saat tanggal berubah
    useEffect(() => {
        if (!selectedDate) return;

        const fetchAvailability = async () => {
            setLoadingSlots(true);
            try {
                const res = await api.get(`/multimedia/availability?date=${selectedDate}`);
                if (res.data?.status === 'success') {
                    setBookedSlots(res.data.data.booked_slots || []);
                }
            } catch (err) {
                // ignore
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchAvailability();
    }, [selectedDate]);

    // Validasi Conflict Checking & Durasi real-time (FR-MM-02, FR-MM-04)
    useEffect(() => {
        let isConflict = false;
        let isDurationValid = true;
        let conflictMsg = null;
        let durationMsg = null;

        if (startTime && endTime) {
            const startParts = startTime.split(':').map(Number);
            const endParts = endTime.split(':').map(Number);

            const startMinutes = startParts[0] * 60 + startParts[1];
            const endMinutes = endParts[0] * 60 + endParts[1];

            if (endMinutes <= startMinutes) {
                isDurationValid = false;
                durationMsg = 'Jam selesai harus lebih akhir dari jam mulai.';
                setDurationText('');
            } else {
                const diffMinutes = endMinutes - startMinutes;
                const hours = Math.floor(diffMinutes / 60);
                const mins = diffMinutes % 60;
                setDurationText(`${hours > 0 ? `${hours} jam ` : ''}${mins > 0 ? `${mins} menit` : ''}`);

                if (diffMinutes > maxDurationMinutes) {
                    isDurationValid = false;
                    const maxH = maxDurationMinutes / 60;
                    durationMsg = `Durasi pemesanan (${diffMinutes} menit) melebihi batas maksimal ${maxH} jam (${maxDurationMinutes} menit).`;
                }

                // Cek overlap dengan bookedSlots: (start < existing.end) AND (end > existing.start)
                const startStr = startTime + ':00';
                const endStr = endTime + ':00';

                const clash = bookedSlots.find(slot => {
                    return startStr < slot.jam_selesai && endStr > slot.jam_mulai;
                });

                if (clash) {
                    isConflict = true;
                    conflictMsg = `Slot jam ini bentrok dengan jadwal terisi: ${clash.nomor_tiket} (${clash.jam_mulai.slice(0, 5)} - ${clash.jam_selesai.slice(0, 5)}).`;
                }
            }
        }

        setConflictError(conflictMsg);
        setDurationError(durationMsg);

        if (onValidationChange) {
            onValidationChange({
                isValid: !isConflict && isDurationValid && Boolean(startTime) && Boolean(endTime),
                hasConflict: isConflict,
                hasDurationError: !isDurationValid,
            });
        }
    }, [startTime, endTime, bookedSlots, maxDurationMinutes]);

    const timeOptions = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Penjadwalan Studio / Multimedia (Conflict-Free System)</span>
            </div>

            {/* Tanggal Pelaksanaan */}
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-2xs"
                    required
                />
            </div>

            {/* Info Slot Terisi Hari Itu (FR-MM-03) */}
            <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
                    <span className="flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ketersediaan Slot Jam ({selectedDate || 'Pilih tanggal'})</span>
                    </span>
                    {loadingSlots && <span className="text-[10px] text-emerald-600 animate-pulse font-medium">Memeriksa...</span>}
                </div>

                {bookedSlots.length === 0 ? (
                    <p className="text-[11px] text-emerald-600 flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Seluruh slot jam masih tersedia pada tanggal ini.</span>
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {bookedSlots.map(slot => (
                            <span
                                key={slot.id}
                                className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold flex items-center space-x-1"
                                title={`Dipesan: ${slot.nomor_tiket} (${slot.status})`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span>{slot.jam_mulai.slice(0, 5)} - {slot.jam_selesai.slice(0, 5)} (Terisi)</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Jam Mulai & Jam Selesai */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jam Mulai <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                        value={startTime}
                        onChange={(val) => setStartTime(val)}
                        options={[
                            { value: '', label: 'Pilih Jam' },
                            ...timeOptions.map(t => ({ value: t, label: t }))
                        ]}
                        placeholder="Pilih Jam"
                        fullWidth
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jam Selesai <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                        value={endTime}
                        onChange={(val) => setEndTime(val)}
                        options={[
                            { value: '', label: 'Pilih Jam' },
                            ...timeOptions.map(t => ({ value: t, label: t }))
                        ]}
                        placeholder="Pilih Jam"
                        fullWidth
                    />
                </div>
            </div>

            {/* Durasi & Error Feedback (FR-MM-04, FR-MM-06) */}
            {durationText && !durationError && (
                <div className="flex items-center justify-between text-xs px-3 py-2 bg-emerald-100/70 text-emerald-800 rounded-lg">
                    <span>Durasi Terpilih: <strong>{durationText}</strong></span>
                    <span className="text-[10px] text-emerald-700 font-semibold">(Maks. {maxDurationMinutes / 60} Jam)</span>
                </div>
            )}

            {durationError && (
                <div className="flex items-center space-x-2 text-xs p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{durationError}</span>
                </div>
            )}

            {conflictError && (
                <div className="flex items-center space-x-2 text-xs p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-semibold">{conflictError}</span>
                </div>
            )}
        </div>
    );
}

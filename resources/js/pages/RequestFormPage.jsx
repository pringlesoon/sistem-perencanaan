import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SplitScreenLayout from '../components/SplitScreenLayout';
import DateTimePicker from '../components/DateTimePicker';
import FileUploader from '../components/FileUploader';
import api from '../services/api';
import confetti from 'canvas-confetti';
import { 
    Send, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    Sparkles, 
    ShieldAlert, 
    Calendar,
    PackageCheck,
    FileText
} from 'lucide-react';

export default function RequestFormPage({ serviceCode, onBack, onSuccess }) {
    const { user } = useAuth();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successTicket, setSuccessTicket] = useState(null);

    // Form states
    const [judul, setJudul] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [tanggalDibutuhkan, setTanggalDibutuhkan] = useState('');
    const [files, setFiles] = useState([]);

    // Specific [M] Multimedia states
    const [mmDate, setMmDate] = useState(new Date().toISOString().split('T')[0]);
    const [mmStartTime, setMmStartTime] = useState('');
    const [mmEndTime, setMmEndTime] = useState('');
    const [mmLokasiAlat, setMmLokasiAlat] = useState('Studio Podcast 1');
    const [mmValid, setMmValid] = useState(false);

    // Specific [S] Suvenir states
    const [suvenirItem, setSuvenirItem] = useState('Tumbler Stainless Logo Emas');
    const [suvenirQty, setSuvenirQty] = useState(10);
    const [suvenirLimit, setSuvenirLimit] = useState(20);

    // Fetch service detail & rules
    useEffect(() => {
        const fetchService = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/services/${serviceCode}`);
                if (res.data?.status === 'success') {
                    setService(res.data.data);
                    if (serviceCode === 'S' && res.data.data.configs?.auto_approval_limit) {
                        setSuvenirLimit(Number(res.data.data.configs.auto_approval_limit));
                    }
                }
            } catch (err) {
                setErrorMsg('Gagal memuat informasi layanan.');
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [serviceCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);

        // Validasi khusus Multimedia
        if (serviceCode === 'M') {
            if (!mmValid) {
                setErrorMsg('Mohon perbaiki waktu jadwal Multimedia yang dipilih (periksa bentrok atau durasi maksimal).');
                return;
            }
        }

        // Validasi khusus Suvenir
        if (serviceCode === 'S') {
            if (Number(suvenirQty) <= 0) {
                setErrorMsg('Jumlah suvenir harus lebih dari 0.');
                return;
            }
        }

        setSubmitting(true);

        const formData = new FormData();
        formData.append('service_code', serviceCode);
        formData.append('judul_permohonan', judul);
        formData.append('deskripsi_kebutuhan', deskripsi);
        if (tanggalDibutuhkan) {
            formData.append('tanggal_dibutuhkan', tanggalDibutuhkan);
        }

        if (serviceCode === 'M') {
            formData.append('tanggal_pelaksanaan', mmDate);
            formData.append('jam_mulai', mmStartTime);
            formData.append('jam_selesai', mmEndTime);
            formData.append('lokasi_alat', mmLokasiAlat);
        }

        if (serviceCode === 'S') {
            formData.append('nama_item', suvenirItem);
            formData.append('qty_diminta', suvenirQty);
        }

        // Attachments
        files.forEach((file) => {
            formData.append('attachments[]', file);
        });

        try {
            const res = await api.post('/requests', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.status === 'success') {
                const permohonan = res.data.data;
                setSuccessTicket(permohonan.nomor_tiket);
                try {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                    });
                } catch (ce) {}
            }
        } catch (err) {
            if (err.response?.status === 409) {
                setErrorMsg(err.response.data.message || 'Jadwal yang Anda pilih bentrok dengan permohonan lain.');
            } else if (err.response?.data?.message) {
                setErrorMsg(err.response.data.message);
            } else {
                setErrorMsg('Terjadi kesalahan saat mengajukan permohonan.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs text-slate-500 font-bold">Memuat Formulir Layanan...</p>
            </div>
        );
    }

    if (successTicket) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Permohonan Berhasil Diajukan!</h2>
                <p className="text-sm text-slate-500 mt-2">
                    Permohonan Anda untuk <strong>{service?.name}</strong> telah tercatat di sistem SAPT.
                </p>

                <div className="my-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl inline-block text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Nomor Tiket Permohonan</p>
                    <p className="text-xl font-black text-indigo-950 font-mono mt-0.5">{successTicket}</p>
                </div>

                <div className="flex justify-center space-x-3 mt-4">
                    <button
                        onClick={onBack}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        Kembali ke Dasbor
                    </button>
                    <button
                        onClick={onSuccess}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors"
                    >
                        Pantau di Tracking
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Top Bar: Back button & Title */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Dasbor</span>
                </button>

                <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500">Formulir Layanan:</span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800">
                        [{service?.code}] {service?.name}
                    </span>
                </div>
            </div>

            {/* Split Screen Container (PRD Section 9.2) */}
            <SplitScreenLayout service={service}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Formulir Pengajuan</h2>
                        <p className="text-xs text-slate-500 mt-1">Lengkapi informasi di bawah ini sesuai kebutuhan unit kerja Anda.</p>
                    </div>

                    {errorMsg && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start space-x-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{errorMsg}</span>
                        </div>
                    )}

                    {/* Auto-filled User info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                        <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Nama Pemohon (LDAP)</span>
                            <span className="font-bold text-slate-800">{user?.name}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Unit Kerja / Divisi</span>
                            <span className="font-bold text-slate-800">{user?.unit_kerja}</span>
                        </div>
                    </div>

                    {/* General: Judul Permohonan */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Judul Permohonan <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={judul}
                            onChange={(e) => setJudul(e.target.value)}
                            placeholder="Contoh: Desain Banner Seminar Nasional AI / Peminjaman Podcast"
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            required
                        />
                    </div>

                    {/* General: Deskripsi Kebutuhan */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Deskripsi / Keperluan Detail <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            placeholder="Jelaskan secara spesifik kebutuhan, target audiens, konsep, atau catatan penting lainnya..."
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            required
                        />
                    </div>

                    {/* General: Tanggal Dibutuhkan (kecuali Multimedia yang punya date picker khusus) */}
                    {serviceCode !== 'M' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Tanggal Target Selesai / Dibutuhkan <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={tanggalDibutuhkan}
                                onChange={(e) => setTanggalDibutuhkan(e.target.value)}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                                required
                            />
                        </div>
                    )}

                    {/* Khusus Multimedia [M]: DateTimePicker & Conflict Checker */}
                    {serviceCode === 'M' && (
                        <div className="space-y-4">
                            <DateTimePicker
                                selectedDate={mmDate}
                                setSelectedDate={setMmDate}
                                startTime={mmStartTime}
                                setStartTime={setMmStartTime}
                                endTime={mmEndTime}
                                setEndTime={setMmEndTime}
                                maxDurationMinutes={180}
                                onValidationChange={(val) => setMmValid(val.isValid)}
                            />

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Lokasi / Peralatan yang Dipinjam
                                </label>
                                <select
                                    value={mmLokasiAlat}
                                    onChange={(e) => setMmLokasiAlat(e.target.value)}
                                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white"
                                >
                                    <option value="Studio Podcast 1 (Lantai 2)">Studio Podcast 1 (Lantai 2)</option>
                                    <option value="Studio Podcast 2 (Lantai 3)">Studio Podcast 2 (Lantai 3)</option>
                                    <option value="Paket Kamera Video & Wireless Mic">Paket Kamera Video & Wireless Mic</option>
                                    <option value="Set Lighting Studio & Green Screen">Set Lighting Studio & Green Screen</option>
                                    <option value="Proyektor 5000 Lumens & Portable Screen">Proyektor 5000 Lumens & Portable Screen</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Khusus Suvenir [S]: Auto-Approval Limit Real-time Calculator */}
                    {serviceCode === 'S' && (
                        <div className="space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                                <PackageCheck className="w-4 h-4 text-amber-600" />
                                <span>Spesifikasi Suvenir & Formula Persetujuan Otomatis</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Pilih Jenis Suvenir <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={suvenirItem}
                                    onChange={(e) => setSuvenirItem(e.target.value)}
                                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white"
                                >
                                    <option value="Tumbler Stainless Logo Emas">Tumbler Stainless Logo Emas</option>
                                    <option value="Goodie Bag & Merchandise Kit Seminar">Goodie Bag & Merchandise Kit Seminar</option>
                                    <option value="Notebook Kulit Eksklusif & Pulpen Parker">Notebook Kulit Eksklusif & Pulpen Parker</option>
                                    <option value="Kaos Polo Bordir Lambang Kampus">Kaos Polo Bordir Lambang Kampus</option>
                                    <option value="Plakat Akrilik / Logam Kenang-kenangan">Plakat Akrilik / Logam Kenang-kenangan</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Jumlah (Qty) yang Diminta <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={suvenirQty}
                                    onChange={(e) => setSuvenirQty(Math.max(1, parseInt(e.target.value) || 0))}
                                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                                    required
                                />
                            </div>

                            {/* Dynamic breakdown badge based on PRD FR-SV-03 */}
                            <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1.5">
                                <div className="flex justify-between items-center font-bold text-slate-800">
                                    <span>Batas Persetujuan Otomatis Sistem:</span>
                                    <span className="text-indigo-600">{suvenirLimit} unit</span>
                                </div>
                                <div className="border-t border-slate-100 pt-2 flex justify-between text-[11px]">
                                    <span className="text-emerald-700 font-semibold">
                                        ✓ Disetujui Otomatis: <strong>{Math.min(suvenirQty, suvenirLimit)} unit</strong>
                                    </span>
                                    {suvenirQty > suvenirLimit ? (
                                        <span className="text-amber-700 font-semibold">
                                            ⏳ Menunggu Approver: <strong>{suvenirQty - suvenirLimit} unit</strong>
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 font-medium">Langsung Diproses</span>
                                    )}
                                </div>
                                {suvenirQty > suvenirLimit && (
                                    <p className="text-[10px] text-amber-800 italic pt-1">
                                        * Permintaan melebihi limit {suvenirLimit} unit akan dikirim ke notifikasi Kepala Divisi untuk disetujui.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lampiran Dokumen */}
                    <FileUploader files={files} setFiles={setFiles} />

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center space-x-2 disabled:opacity-60 cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                            <span>{submitting ? 'Mengirim Permohonan...' : 'Ajukan Permohonan'}</span>
                        </button>
                    </div>
                </form>
            </SplitScreenLayout>
        </div>
    );
}

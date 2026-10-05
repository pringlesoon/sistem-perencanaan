import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SplitScreenLayout from '../components/SplitScreenLayout';
import DateTimePicker from '../components/DateTimePicker';
import FileUploader from '../components/FileUploader';
import CustomSelect from '../components/CustomSelect';
import api from '../services/api';
import confetti from 'canvas-confetti';
import { 
    Send, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    Sparkles, 
    Calendar,
    Clock,
    PackageCheck,
    FileText,
    Camera,
    Megaphone,
    Palette,
    Video,
    Gift,
    HelpCircle,
    Info,
    Package,
    Plus,
    Trash2
} from 'lucide-react';

export default function RequestFormPage({ serviceCode, onBack, onSuccess }) {
    const { user } = useAuth();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successTicket, setSuccessTicket] = useState(null);

    // Common fields across all forms (kosong default)
    const [namaPemohon, setNamaPemohon] = useState('');
    const [unitPemohon, setUnitPemohon] = useState('');
    const [noWhatsappPemohon, setNoWhatsappPemohon] = useState('');
    const [namaKegiatan, setNamaKegiatan] = useState('');
    const [tanggalKegiatan, setTanggalKegiatan] = useState('');
    const [waktuKegiatan, setWaktuKegiatan] = useState('');
    const [lokasiKegiatan, setLokasiKegiatan] = useState('');
    const [namaPicKegiatan, setNamaPicKegiatan] = useState('');
    const [noWhatsappPic, setNoWhatsappPic] = useState('');
    const [files, setFiles] = useState([]);

    // Specific [D] Desain Grafis states (kosong default)
    const [jenisDesain, setJenisDesain] = useState([]);
    const [jenisDesainLainnya, setJenisDesainLainnya] = useState('');
    const [tujuanPermintaanDesain, setTujuanPermintaanDesain] = useState('');
    const [judulTemaDesain, setJudulTemaDesain] = useState('');
    const [informasiDicantumkan, setInformasiDicantumkan] = useState('');
    const [ukuranDesain, setUkuranDesain] = useState('');
    const [mediaPenggunaan, setMediaPenggunaan] = useState('');
    const [deadlineDesain, setDeadlineDesain] = useState('');
    const [referensiDesain, setReferensiDesain] = useState('');

    // Specific [P] Publikasi states (kosong default)
    const [mediaPublikasi, setMediaPublikasi] = useState([]);
    const [isiCaption, setIsiCaption] = useState('');
    const [tagMention, setTagMention] = useState('');
    const [tanggalPublikasi, setTanggalPublikasi] = useState('');
    const [linkDrivePublikasi, setLinkDrivePublikasi] = useState('');

    // Specific [S] Alat Promosi states (kosong default)
    const [kategoriPromosi, setKategoriPromosi] = useState('');
    const [kategoriPromosiLainnya, setKategoriPromosiLainnya] = useState('');
    const [tanggalDibutuhkanPromosi, setTanggalDibutuhkanPromosi] = useState('');
    const [souvenirItems, setSouvenirItems] = useState([
        { id: 'goodiebag', nama_item: 'Goodiebag', qty: 0, checked: false },
        { id: 'brosur_s1', nama_item: 'Brosur S1', qty: 0, checked: false },
        { id: 'brosur_s2', nama_item: 'Brosur S2', qty: 0, checked: false },
        { id: 'stiker_yarsi', nama_item: 'Stiker YARSI', qty: 0, checked: false },
        { id: 'notebook', nama_item: 'Notebook', qty: 0, checked: false },
        { id: 'pulpen', nama_item: 'Pulpen', qty: 0, checked: false },
        { id: 'kipas', nama_item: 'Kipas', qty: 0, checked: false },
        { id: 'gantungan_kunci', nama_item: 'Gantungan Kunci', qty: 0, checked: false },
        { id: 'kalender', nama_item: 'Kalender', qty: 0, checked: false },
        { id: 'majalah_kabar', nama_item: 'Majalah KABAR', qty: 0, checked: false },
    ]);
    const [suvenirLainnyaNama, setSuvenirLainnyaNama] = useState('');
    const [suvenirLainnyaQty, setSuvenirLainnyaQty] = useState('');
    const [suvenirLainnyaChecked, setSuvenirLainnyaChecked] = useState(false);
    const [suvenirLimit, setSuvenirLimit] = useState(20);

    // Specific [M] Multimedia states (kosong default)
    const [jenisKebutuhanMm, setJenisKebutuhanMm] = useState([]);
    const [konsepKontenMm, setKonsepKontenMm] = useState('');
    const [tanggalProduksiMm, setTanggalProduksiMm] = useState('');
    const [lokasiProduksiMm, setLokasiProduksiMm] = useState('');
    const [mmStartTime, setMmStartTime] = useState('');
    const [mmEndTime, setMmEndTime] = useState('');
    const [narasumberMm, setNarasumberMm] = useState('');
    const [outputMm, setOutputMm] = useState('');
    const [linkDriveMm, setLinkDriveMm] = useState('');
    const [mmValid, setMmValid] = useState(false);

    // Specific [L] Peliputan states (kosong default)
    const [jenisPeliputan, setJenisPeliputan] = useState([]);
    const [rundownAcara, setRundownAcara] = useState('');
    const [pimpinanTamuHadir, setPimpinanTamuHadir] = useState('');
    const [waktuPeliputan, setWaktuPeliputan] = useState('');

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


    // Calculate total requested souvenirs
    const totalSouvenirQty = souvenirItems.reduce((acc, curr) => {
        return curr.checked ? acc + (parseInt(curr.qty, 10) || 0) : acc;
    }, 0) + (suvenirLainnyaChecked ? (parseInt(suvenirLainnyaQty, 10) || 0) : 0);

    const toggleCheckbox = (list, setList, item) => {
        if (list.includes(item)) {
            setList(list.filter(x => x !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleSouvenirItemChange = (index, field, value) => {
        const updated = [...souvenirItems];
        updated[index][field] = value;
        if (field === 'checked') {
            if (!value) {
                updated[index].qty = 0;
            } else if (!updated[index].qty) {
                updated[index].qty = '';
            }
        }
        setSouvenirItems(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);

        // Validasi identitas pemohon (umum untuk semua layanan)
        if (!namaPemohon.trim()) {
            setErrorMsg('Nama pemohon wajib diisi.');
            return;
        }
        if (!unitPemohon.trim()) {
            setErrorMsg('Program Studi / Unit Pemohon wajib diisi.');
            return;
        }
        if (!noWhatsappPemohon.trim()) {
            setErrorMsg('No. Whatsapp pemohon wajib diisi.');
            return;
        }

        // Validasi per layanan
        if (serviceCode === 'D') {
            if (jenisDesain.length === 0 && !jenisDesainLainnya.trim()) {
                setErrorMsg('Pilih minimal satu jenis desain.');
                return;
            }
            if (!deadlineDesain) {
                setErrorMsg('Deadline penggunaan desain wajib diisi.');
                return;
            }
        } else if (serviceCode === 'P') {
            if (mediaPublikasi.length === 0) {
                setErrorMsg('Pilih minimal satu media publikasi.');
                return;
            }
            if (!tanggalPublikasi) {
                setErrorMsg('Tanggal publikasi wajib diisi.');
                return;
            }
        } else if (serviceCode === 'S') {
            if (!kategoriPromosi) {
                setErrorMsg('Pilih kategori kegiatan / program alat promosi.');
                return;
            }
            if (kategoriPromosi === 'Lainnya' && !kategoriPromosiLainnya.trim()) {
                setErrorMsg('Mohon tuliskan rincian kategori kegiatan lainnya.');
                return;
            }
            if (totalSouvenirQty <= 0) {
                setErrorMsg('Pilih minimal satu jenis suvenir dan masukkan jumlahnya (lebih dari 0).');
                return;
            }
            if (!tanggalDibutuhkanPromosi) {
                setErrorMsg('Tanggal suvenir dibutuhkan wajib diisi.');
                return;
            }
            if (files.length === 0) {
                setErrorMsg('Surat permohonan alat promosi dari pimpinan unit kerja wajib diunggah.');
                return;
            }
        } else if (serviceCode === 'M') {
            if (jenisKebutuhanMm.length === 0) {
                setErrorMsg('Pilih minimal satu jenis kebutuhan multimedia.');
                return;
            }
            if (!tanggalProduksiMm) {
                setErrorMsg('Tanggal pelaksanaan/produksi multimedia wajib diisi.');
                return;
            }
            if (!mmStartTime || !mmEndTime) {
                setErrorMsg('Jam mulai dan jam selesai multimedia wajib dipilih.');
                return;
            }
            if (!mmValid) {
                setErrorMsg('Jadwal multimedia tidak valid (maksimal 3 jam dan tidak boleh bentrok).');
                return;
            }
            if (files.length === 0) {
                setErrorMsg('Surat permohonan multimedia dari pimpinan unit kerja wajib diunggah.');
                return;
            }
        } else if (serviceCode === 'L') {
            if (jenisPeliputan.length === 0) {
                setErrorMsg('Pilih minimal satu jenis peliputan.');
                return;
            }
        }

        setSubmitting(true);

        const formDataPayload = {};
        let finalJudul = '';
        let finalDeskripsi = '';
        let finalTanggalDibutuhkan = '';

        if (serviceCode === 'D') {
            finalJudul = judulTemaDesain || namaKegiatan || 'Permintaan Desain Grafis';
            finalDeskripsi = `Jenis: ${[...jenisDesain, jenisDesainLainnya].filter(Boolean).join(', ')}\nTujuan: ${tujuanPermintaanDesain}\nInfo: ${informasiDicantumkan}`;
            finalTanggalDibutuhkan = deadlineDesain;
            Object.assign(formDataPayload, {
                jenis_desain: jenisDesain,
                jenis_desain_lainnya: jenisDesainLainnya,
                unit_pemohon: unitPemohon,
                no_whatsapp_pemohon: noWhatsappPemohon,
                nama_kegiatan: namaKegiatan,
                tanggal_kegiatan: tanggalKegiatan,
                waktu_kegiatan: waktuKegiatan,
                lokasi_kegiatan: lokasiKegiatan,
                nama_pic_kegiatan: namaPicKegiatan,
                no_whatsapp_pic: noWhatsappPic,
                tujuan_permintaan: tujuanPermintaanDesain,
                judul_tema: judulTemaDesain,
                informasi_dicantumkan: informasiDicantumkan,
                ukuran_desain: ukuranDesain,
                media_penggunaan: mediaPenggunaan,
                deadline: deadlineDesain,
                referensi_desain: referensiDesain,
            });
        } else if (serviceCode === 'P') {
            finalJudul = namaKegiatan ? `Publikasi: ${namaKegiatan}` : 'Permintaan Publikasi';
            finalDeskripsi = `Media: ${mediaPublikasi.join(', ')}\nCaption: ${isiCaption}\nTag: ${tagMention}`;
            finalTanggalDibutuhkan = tanggalPublikasi;
            Object.assign(formDataPayload, {
                media_publikasi: mediaPublikasi,
                unit_pemohon: unitPemohon,
                no_whatsapp_pemohon: noWhatsappPemohon,
                nama_kegiatan: namaKegiatan,
                tanggal_kegiatan: tanggalKegiatan,
                waktu_kegiatan: waktuKegiatan,
                nama_pic_publikasi: namaPicKegiatan,
                kontak_pic_publikasi: noWhatsappPic,
                isi_caption: isiCaption,
                tag_mention: tagMention,
                tanggal_publikasi: tanggalPublikasi,
                link_drive: linkDrivePublikasi,
            });
        } else if (serviceCode === 'S') {
            const activeSouvenirs = souvenirItems
                .filter(it => it.checked && parseInt(it.qty, 10) > 0)
                .map(it => ({ nama_item: it.nama_item, qty: parseInt(it.qty, 10) }));

            if (suvenirLainnyaChecked && suvenirLainnyaNama && parseInt(suvenirLainnyaQty, 10) > 0) {
                activeSouvenirs.push({ nama_item: suvenirLainnyaNama, qty: parseInt(suvenirLainnyaQty, 10) });
            }

            const displayKategori = kategoriPromosi === 'Lainnya' && kategoriPromosiLainnya.trim()
                ? `Lainnya (${kategoriPromosiLainnya.trim()})`
                : kategoriPromosi;

            finalJudul = namaKegiatan ? `Alat Promosi: ${namaKegiatan}` : 'Permohonan Alat Promosi & Suvenir';
            finalDeskripsi = `Kategori: ${displayKategori}\nSouvenir: ${activeSouvenirs.map(s => `${s.nama_item} (${s.qty})`).join(', ')}`;
            finalTanggalDibutuhkan = tanggalDibutuhkanPromosi;
            Object.assign(formDataPayload, {
                unit_pemohon: unitPemohon,
                no_whatsapp_pemohon: noWhatsappPemohon,
                kategori_kegiatan: displayKategori,
                kategori_promosi_pilihan: kategoriPromosi,
                kategori_promosi_lainnya: kategoriPromosiLainnya.trim(),
                nama_kegiatan: namaKegiatan,
                tanggal_kegiatan: tanggalKegiatan,
                waktu_kegiatan: waktuKegiatan,
                lokasi_kegiatan: lokasiKegiatan,
                nama_pic_kegiatan: namaPicKegiatan,
                no_whatsapp_pic: noWhatsappPic,
                souvenir_items: activeSouvenirs,
                tanggal_dibutuhkan: tanggalDibutuhkanPromosi,
            });
        } else if (serviceCode === 'M') {
            finalJudul = namaKegiatan ? `Multimedia: ${namaKegiatan}` : 'Permohonan Layanan Multimedia';
            finalDeskripsi = `Jenis: ${jenisKebutuhanMm.join(', ')}\nKonsep: ${konsepKontenMm}\nOutput: ${outputMm}`;
            finalTanggalDibutuhkan = tanggalProduksiMm;
            Object.assign(formDataPayload, {
                jenis_kebutuhan: jenisKebutuhanMm,
                unit_pemohon: unitPemohon,
                no_whatsapp_pemohon: noWhatsappPemohon,
                nama_kegiatan: namaKegiatan,
                tanggal_kegiatan: tanggalKegiatan,
                waktu_kegiatan: waktuKegiatan,
                lokasi_kegiatan: lokasiKegiatan,
                nama_pic_kegiatan: namaPicKegiatan,
                no_whatsapp_pic: noWhatsappPic,
                konsep_konten: konsepKontenMm,
                tanggal_produksi: tanggalProduksiMm,
                lokasi_produksi: lokasiProduksiMm,
                jam_mulai: mmStartTime,
                jam_selesai: mmEndTime,
                narasumber_talent: narasumberMm,
                output_diharapkan: outputMm,
                link_drive: linkDriveMm,
            });
        } else if (serviceCode === 'L') {
            finalJudul = namaKegiatan ? `Peliputan: ${namaKegiatan}` : 'Permohonan Peliputan Berita';
            finalDeskripsi = `Jenis: ${jenisPeliputan.join(', ')}\nRundown: ${rundownAcara}\nPimpinan/Tamu: ${pimpinanTamuHadir}`;
            finalTanggalDibutuhkan = tanggalKegiatan;
            Object.assign(formDataPayload, {
                jenis_peliputan: jenisPeliputan,
                unit_pemohon: unitPemohon,
                no_whatsapp_pemohon: noWhatsappPemohon,
                nama_kegiatan: namaKegiatan,
                rundown_acara: rundownAcara,
                pimpinan_tamu_hadir: pimpinanTamuHadir,
                waktu_peliputan: waktuPeliputan,
            });
        }

        formDataPayload.nama_pemohon = namaPemohon;
        formDataPayload.unit_pemohon = unitPemohon;
        formDataPayload.no_whatsapp_pemohon = noWhatsappPemohon;

        const data = new FormData();
        data.append('service_code', serviceCode);
        data.append('judul_permohonan', finalJudul);
        data.append('deskripsi_kebutuhan', finalDeskripsi);
        if (finalTanggalDibutuhkan) {
            data.append('tanggal_dibutuhkan', finalTanggalDibutuhkan);
        }
        data.append('form_data', JSON.stringify(formDataPayload));

        // Format khusus untuk service S dan M agar kompatibel dengan tabel relasi detail
        if (serviceCode === 'M') {
            data.append('tanggal_pelaksanaan', tanggalProduksiMm);
            data.append('jam_mulai', mmStartTime);
            data.append('jam_selesai', mmEndTime);
            data.append('lokasi_alat', lokasiProduksiMm);
        }

        if (serviceCode === 'S') {
            const firstActive = souvenirItems.find(s => s.checked && s.qty > 0);
            data.append('nama_item', firstActive ? firstActive.nama_item : 'Suvenir Paket Humas');
            data.append('qty_diminta', totalSouvenirQty);
        }

        files.forEach((file) => {
            data.append('attachments[]', file);
        });

        try {
            const res = await api.post('/requests', data, {
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
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Kembali ke Dasbor
                    </button>
                    <button
                        onClick={onSuccess}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors cursor-pointer"
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
                    className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Dasbor</span>
                </button>

                <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500">Formulir Layanan:</span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800">
                        {service?.name}
                    </span>
                </div>
            </div>

            {/* Split Screen Container (PRD Section 9.2) */}
            <SplitScreenLayout service={service}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">
                            Formulir Pengajuan {service?.name || 'Layanan'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Sesuai standar operasional Humas Universitas YARSI. Lengkapi formulir di bawah ini dengan benar.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start space-x-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{errorMsg}</span>
                        </div>
                    )}

                    {/* Identitas Pemohon (Umum untuk semua layanan) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                            1. Identitas Unit Pemohon
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                                <label className="block text-slate-600 font-bold mb-1">
                                    Nama Pemohon <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={namaPemohon}
                                    onChange={(e) => setNamaPemohon(e.target.value)}
                                    placeholder="Nama lengkap pemohon"
                                    required
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 font-bold mb-1">
                                    Program Studi / Unit Pemohon <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={unitPemohon}
                                    onChange={(e) => setUnitPemohon(e.target.value)}
                                    placeholder="Contoh: Biro Akademik & Kemahasiswaan"
                                    required
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 font-bold mb-1">
                                    No. Whatsapp Pemohon <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={noWhatsappPemohon}
                                    onChange={(e) => setNoWhatsappPemohon(e.target.value)}
                                    placeholder="Contoh: 081234567890"
                                    required
                                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ============================================================== */}
                    {/* FORM PERMINTAAN DESAIN GRAFIS [D]                               */}
                    {/* ============================================================== */}
                    {serviceCode === 'D' && (
                        <div className="space-y-4">
                            {/* Jenis Desain (Checklist) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Jenis Desain <span className="text-rose-500">*</span> (Bisa pilih lebih dari satu)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    {[
                                        'Brosur',
                                        'Poster Cetak',
                                        'Banner/Spanduk',
                                        'Flyer Digital',
                                        'Sertifikat',
                                        'Instagram Post',
                                        'Infografis',
                                    ].map((item) => (
                                        <label
                                            key={item}
                                            className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                jenisDesain.includes(item)
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={jenisDesain.includes(item)}
                                                onChange={() => toggleCheckbox(jenisDesain, setJenisDesain, item)}
                                                className="rounded text-indigo-600"
                                            />
                                            <span className="text-[11px]">{item}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-2 flex items-center space-x-2">
                                    <span className="text-xs font-semibold text-slate-600">Lainnya:</span>
                                    <input
                                        type="text"
                                        value={jenisDesainLainnya}
                                        onChange={(e) => setJenisDesainLainnya(e.target.value)}
                                        placeholder="Sebutkan jenis desain lainnya..."
                                        className="flex-1 px-3 py-1.5 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>

                            {/* Informasi Kegiatan */}
                            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                                    Informasi Kegiatan / Program
                                </span>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Kegiatan / Program <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={namaKegiatan}
                                        onChange={(e) => setNamaKegiatan(e.target.value)}
                                        placeholder="Contoh: Seminar Nasional Kesehatan Reproduksi 2026"
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Kegiatan</label>
                                        <input
                                            type="date"
                                            value={tanggalKegiatan}
                                            onChange={(e) => setTanggalKegiatan(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Waktu</label>
                                        <input
                                            type="time"
                                            value={waktuKegiatan}
                                            onChange={(e) => setWaktuKegiatan(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Lokasi</label>
                                        <input
                                            type="text"
                                            value={lokasiKegiatan}
                                            onChange={(e) => setLokasiKegiatan(e.target.value)}
                                            placeholder="Contoh: Auditorium Lt. 12"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama PIC Kegiatan</label>
                                        <input
                                            type="text"
                                            value={namaPicKegiatan}
                                            onChange={(e) => setNamaPicKegiatan(e.target.value)}
                                            placeholder="Nama lengkap PIC lapangan"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">No. Whatsapp PIC Kegiatan</label>
                                        <input
                                            type="tel"
                                            value={noWhatsappPic}
                                            onChange={(e) => setNoWhatsappPic(e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Detail Spesifikasi Desain */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Judul / Tema Desain <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={judulTemaDesain}
                                        onChange={(e) => setJudulTemaDesain(e.target.value)}
                                        placeholder="Tuliskan judul atau tema utama yang akan tertera di desain"
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Tujuan Permintaan
                                    </label>
                                    <input
                                        type="text"
                                        value={tujuanPermintaanDesain}
                                        onChange={(e) => setTujuanPermintaanDesain(e.target.value)}
                                        placeholder="Contoh: Publikasi penerimaan mahasiswa baru / sosialisasi beasiswa"
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Informasi yang Harus Dicantumkan <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={informasiDicantumkan}
                                        onChange={(e) => setInformasiDicantumkan(e.target.value)}
                                        placeholder="Tuliskan teks lengkap yang wajib dicantumkan: Pembicara, Jadwal, Link Registrasi, Biaya, Narahubung, dll."
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Ukuran Desain <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={ukuranDesain}
                                            onChange={(e) => setUkuranDesain(e.target.value)}
                                            placeholder="Contoh: A4 / 1080x1080 / 3x1 meter"
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Media Penggunaan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={mediaPenggunaan}
                                            onChange={(e) => setMediaPenggunaan(e.target.value)}
                                            placeholder="Contoh: Cetak Poster / IG Feed / Baliho"
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Deadline Penggunaan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={deadlineDesain}
                                            onChange={(e) => setDeadlineDesain(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Referensi Desain</label>
                                    <input
                                        type="text"
                                        value={referensiDesain}
                                        onChange={(e) => setReferensiDesain(e.target.value)}
                                        placeholder="Link Pinterest/Canva/Behance atau deskripsi gaya visual yang diinginkan"
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* FORM PERMINTAAN PUBLIKASI [P]                                   */}
                    {/* ============================================================== */}
                    {serviceCode === 'P' && (
                        <div className="space-y-4">
                            {/* Media Publikasi (Checklist) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Media Publikasi <span className="text-rose-500">*</span> (Bisa pilih lebih dari satu)
                                </label>
                                <div className="space-y-2 text-xs">
                                    {[
                                        'Feed/Reels Instagram @universitasyarsi',
                                        'Story Instagram @universitasyarsi',
                                        'Website yarsi.ac.id',
                                    ].map((media) => (
                                        <label
                                            key={media}
                                            className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                                mediaPublikasi.includes(media)
                                                    ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={mediaPublikasi.includes(media)}
                                                onChange={() => toggleCheckbox(mediaPublikasi, setMediaPublikasi, media)}
                                                className="rounded text-sky-600"
                                            />
                                            <span>{media}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Informasi Kegiatan */}
                            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Kegiatan yang Ingin Dipublikasikan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={namaKegiatan}
                                        onChange={(e) => setNamaKegiatan(e.target.value)}
                                        placeholder="Contoh: Kuliah Umum Kebangsaan Bersama Tokoh Nasional"
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Kegiatan</label>
                                        <input
                                            type="date"
                                            value={tanggalKegiatan}
                                            onChange={(e) => setTanggalKegiatan(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Waktu</label>
                                        <input
                                            type="time"
                                            value={waktuKegiatan}
                                            onChange={(e) => setWaktuKegiatan(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama PIC Pengaju Publikasi</label>
                                        <input
                                            type="text"
                                            value={namaPicKegiatan}
                                            onChange={(e) => setNamaPicKegiatan(e.target.value)}
                                            placeholder="Nama lengkap PIC"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Kontak PIC Pengaju</label>
                                        <input
                                            type="tel"
                                            value={noWhatsappPic}
                                            onChange={(e) => setNoWhatsappPic(e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Isi / Caption & Tanggal Publikasi */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Isi / Caption Publikasi <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={isiCaption}
                                        onChange={(e) => setIsiCaption(e.target.value)}
                                        placeholder="Tuliskan draft naskah caption yang sudah final dan bebas dari kesalahan ejaan/typo..."
                                        required
                                        className="w-full px-3 py-2.5 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Tag / Mention Akun
                                        </label>
                                        <input
                                            type="text"
                                            value={tagMention}
                                            onChange={(e) => setTagMention(e.target.value)}
                                            placeholder="Contoh: @fk.yarsi @bem_yarsi @kemahasiswaan"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Tanggal Publikasi yang Diinginkan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={tanggalPublikasi}
                                            onChange={(e) => setTanggalPublikasi(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Link Google Drive Materi (Opsional)
                                    </label>
                                    <input
                                        type="url"
                                        value={linkDrivePublikasi}
                                        onChange={(e) => setLinkDrivePublikasi(e.target.value)}
                                        placeholder="https://drive.google.com/..."
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* FORM PERMINTAAN ALAT PROMOSI [S]                                */}
                    {/* ============================================================== */}
                    {serviceCode === 'S' && (
                        <div className="space-y-4">
                            {/* Kategori Kegiatan Promosi */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Kategori Kegiatan / Program <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    {['Promosi Kampus', 'Tamu Eksternal', 'Kegiatan kelembagaan', 'Lainnya'].map((kat) => (
                                        <label
                                            key={kat}
                                            className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                                                kategoriPromosi === kat
                                                    ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="kategoriPromosi"
                                                checked={kategoriPromosi === kat}
                                                onChange={() => setKategoriPromosi(kat)}
                                                className="sr-only"
                                            />
                                            <span>{kat}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Kolom Isian Khusus Opsi "Lainnya" */}
                                {kategoriPromosi === 'Lainnya' && (
                                    <div className="mt-2.5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 animate-fadeIn">
                                        <label className="block text-[11px] font-bold text-amber-900">
                                            Rincian Kategori Kegiatan / Kebutuhan Lainnya <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={kategoriPromosiLainnya}
                                            onChange={(e) => setKategoriPromosiLainnya(e.target.value)}
                                            placeholder="Contoh: Kunjungan Studi Banding / Workshop Khusus..."
                                            required={kategoriPromosi === 'Lainnya'}
                                            className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium placeholder:text-slate-400"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Informasi Kegiatan */}
                            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Kegiatan / Program <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={namaKegiatan}
                                        onChange={(e) => setNamaKegiatan(e.target.value)}
                                        placeholder="Contoh: Kunjungan Studi Banding Universitas Luar Negeri"
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Kegiatan</label>
                                        <input
                                            type="date"
                                            value={tanggalKegiatan}
                                            onChange={(e) => setTanggalKegiatan(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Waktu</label>
                                        <input
                                            type="time"
                                            value={waktuKegiatan}
                                            onChange={(e) => setWaktuKegiatan(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Lokasi Kegiatan</label>
                                        <input
                                            type="text"
                                            value={lokasiKegiatan}
                                            onChange={(e) => setLokasiKegiatan(e.target.value)}
                                            placeholder="Contoh: Ruang Senat Lt. 1"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama PIC Kegiatan</label>
                                        <input
                                            type="text"
                                            value={namaPicKegiatan}
                                            onChange={(e) => setNamaPicKegiatan(e.target.value)}
                                            placeholder="Nama penanggung jawab"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">No. Whatsapp PIC Kegiatan</label>
                                        <input
                                            type="tel"
                                            value={noWhatsappPic}
                                            onChange={(e) => setNoWhatsappPic(e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Keperluan Souvenir (Jenis & Jumlah berdampingan, bisa lebih dari 1) */}
                            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                                        <PackageCheck className="w-4 h-4 text-amber-600" />
                                        <span>Keperluan Souvenir (Pilih Jenis & Tentukan Jumlah)</span>
                                    </div>
                                    <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg">
                                        Total: {totalSouvenirQty} Unit
                                    </span>
                                </div>

                                <div className="p-2.5 bg-amber-100/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start space-x-2">
                                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Perhatian:</strong> Sesuai Syarat & Ketentuan resmi Humas, jenis alat promosi <strong>tidak termasuk plakat</strong>.
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {souvenirItems.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                                item.checked ? 'bg-white border-amber-400 shadow-2xs' : 'bg-slate-50/70 border-slate-200'
                                            }`}
                                        >
                                            <label className="flex items-center space-x-2 cursor-pointer flex-1 mr-2">
                                                <input
                                                    type="checkbox"
                                                    checked={item.checked}
                                                    onChange={(e) => handleSouvenirItemChange(idx, 'checked', e.target.checked)}
                                                    className="rounded text-amber-600"
                                                />
                                                <span className="font-semibold text-slate-800 text-[11px]">{item.nama_item}</span>
                                            </label>
                                            {item.checked && (
                                                <div className="flex items-center space-x-1">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        placeholder="0"
                                                        value={item.qty === 0 || item.qty === '' ? '' : item.qty}
                                                        onChange={(e) => handleSouvenirItemChange(idx, 'qty', e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)}
                                                        className="w-16 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-center"
                                                    />
                                                    <span className="text-[10px] text-slate-400">unit</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Opsi Souvenir Lainnya */}
                                <div className="pt-2 border-t border-amber-200/80">
                                    <div className="flex items-center space-x-2 text-xs">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={suvenirLainnyaChecked}
                                                onChange={(e) => setSuvenirLainnyaChecked(e.target.checked)}
                                                className="rounded text-amber-600"
                                            />
                                            <span className="font-bold text-slate-700">Lainnya, Sebutkan:</span>
                                        </label>
                                        {suvenirLainnyaChecked && (
                                            <>
                                                <input
                                                    type="text"
                                                    value={suvenirLainnyaNama}
                                                    onChange={(e) => setSuvenirLainnyaNama(e.target.value)}
                                                    placeholder="Nama item souvenir..."
                                                    className="flex-1 px-2.5 py-1 text-xs bg-white rounded-lg border border-amber-300"
                                                />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={suvenirLainnyaQty}
                                                    onChange={(e) => setSuvenirLainnyaQty(e.target.value)}
                                                    placeholder="Qty"
                                                    className="w-16 px-2 py-1 text-xs bg-white rounded-lg border border-amber-300 text-center font-bold"
                                                />
                                                <span className="text-[10px] text-slate-400">unit</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Ringkasan Total Permintaan Souvenir */}
                                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Package className="w-4 h-4 text-amber-600" />
                                        <span className="font-bold text-slate-800">Total Kebutuhan Suvenir:</span>
                                    </div>
                                    <span className="font-extrabold text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-lg border border-amber-300">
                                        {totalSouvenirQty} unit
                                    </span>
                                </div>

                                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
                                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>
                                        Seluruh alokasi alat promosi & suvenir akan diverifikasi dan disetujui langsung oleh <strong>PIC Alat Promosi / Humas</strong> sesuai ketersediaan stok fisik di gudang.
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Tanggal Souvenir Dibutuhkan <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={tanggalDibutuhkanPromosi}
                                    onChange={(e) => setTanggalDibutuhkanPromosi(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                />
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* FORM PERMINTAAN MULTIMEDIA [M]                                 */}
                    {/* ============================================================== */}
                    {serviceCode === 'M' && (
                        <div className="space-y-4">
                            {/* Jenis Kebutuhan (Checklist) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Jenis Kebutuhan <span className="text-rose-500">*</span> (Bisa pilih lebih dari satu)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                    {[
                                        'Foto Dokumentasi',
                                        'Operator Podcast',
                                        'Video Promosi',
                                        'Editing Video',
                                        'Live Streaming',
                                        'Video Dokumentasi',
                                    ].map((item) => (
                                        <label
                                            key={item}
                                            className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                jenisKebutuhanMm.includes(item)
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={jenisKebutuhanMm.includes(item)}
                                                onChange={() => toggleCheckbox(jenisKebutuhanMm, setJenisKebutuhanMm, item)}
                                                className="rounded text-emerald-600"
                                            />
                                            <span className="text-[11px]">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Informasi Kegiatan */}
                            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Kegiatan / Program <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={namaKegiatan}
                                        onChange={(e) => setNamaKegiatan(e.target.value)}
                                        placeholder="Contoh: Podcast Humas YARSI Seri 10 / Liputan Wisuda"
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Kegiatan</label>
                                        <input
                                            type="date"
                                            value={tanggalKegiatan}
                                            onChange={(e) => setTanggalKegiatan(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Waktu</label>
                                        <input
                                            type="time"
                                            value={waktuKegiatan}
                                            onChange={(e) => setWaktuKegiatan(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Lokasi Kegiatan</label>
                                        <input
                                            type="text"
                                            value={lokasiKegiatan}
                                            onChange={(e) => setLokasiKegiatan(e.target.value)}
                                            placeholder="Contoh: Studio Podcast / Ruang Rapat"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama PIC Kegiatan</label>
                                        <input
                                            type="text"
                                            value={namaPicKegiatan}
                                            onChange={(e) => setNamaPicKegiatan(e.target.value)}
                                            placeholder="Nama lengkap PIC"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">No. Whatsapp PIC Kegiatan</label>
                                        <input
                                            type="tel"
                                            value={noWhatsappPic}
                                            onChange={(e) => setNoWhatsappPic(e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Konsep & Detail Produksi */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Konsep / Kebutuhan Konten <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={konsepKontenMm}
                                        onChange={(e) => setKonsepKontenMm(e.target.value)}
                                        placeholder="Jelaskan alur, konsep visual, materi yang akan direkam/diliput..."
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>

                                {/* Penjadwalan Produksi & DateTimePicker Conflict Free */}
                                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                                        Penjadwalan & Peminjaman Ruangan/Alat (Maksimal 3 Jam)
                                    </span>
                                    <DateTimePicker
                                        selectedDate={tanggalProduksiMm}
                                        setSelectedDate={setTanggalProduksiMm}
                                        startTime={mmStartTime}
                                        setStartTime={setMmStartTime}
                                        endTime={mmEndTime}
                                        setEndTime={setMmEndTime}
                                        maxDurationMinutes={180}
                                        onValidationChange={(val) => setMmValid(val.isValid)}
                                    />
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Lokasi Produksi / Ruangan / Alat
                                        </label>
                                        <CustomSelect
                                            value={lokasiProduksiMm}
                                            onChange={(val) => setLokasiProduksiMm(val)}
                                            options={[
                                                { value: 'Studio Podcast 1 (Lantai 2)', label: 'Studio Podcast 1 (Lantai 2)' },
                                                { value: 'Studio Podcast 2 (Lantai 3)', label: 'Studio Podcast 2 (Lantai 3)' },
                                                { value: 'Paket Kamera Video Sony Cinema & Wireless Mic', label: 'Paket Kamera Video Sony Cinema & Wireless Mic' },
                                                { value: 'Set Lighting Studio & Green Screen', label: 'Set Lighting Studio & Green Screen' },
                                                { value: 'Proyektor 5000 Lumens & Portable Screen', label: 'Proyektor 5000 Lumens & Portable Screen' },
                                                { value: 'Lokasi Eksternal / Lapangan Kampus', label: 'Lokasi Eksternal / Lapangan Kampus' },
                                            ]}
                                            placeholder="Pilih Lokasi / Ruangan / Alat"
                                            fullWidth
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Narasumber / Talent (Jika Ada)
                                        </label>
                                        <input
                                            type="text"
                                            value={narasumberMm}
                                            onChange={(e) => setNarasumberMm(e.target.value)}
                                            placeholder="Contoh: Rektor / Pakar AI / Alumni"
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Output yang Diharapkan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={outputMm}
                                            onChange={(e) => setOutputMm(e.target.value)}
                                            placeholder="Contoh: Video Reels 60 detik & Dokumentasi Foto HD"
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Link Drive Materi / Video Pendukung (Opsional)
                                    </label>
                                    <input
                                        type="url"
                                        value={linkDriveMm}
                                        onChange={(e) => setLinkDriveMm(e.target.value)}
                                        placeholder="https://drive.google.com/..."
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* FORM PERMINTAAN PELIPUTAN [L]                                  */}
                    {/* ============================================================== */}
                    {serviceCode === 'L' && (
                        <div className="space-y-4">
                            {/* Jenis Peliputan */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Jenis Peliputan <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    {['Wawancara', 'Penulisan Berita'].map((item) => (
                                        <label
                                            key={item}
                                            className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                                jenisPeliputan.includes(item)
                                                    ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={jenisPeliputan.includes(item)}
                                                onChange={() => toggleCheckbox(jenisPeliputan, setJenisPeliputan, item)}
                                                className="rounded text-rose-600"
                                            />
                                            <span>{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Detail Peliputan */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Kegiatan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={namaKegiatan}
                                        onChange={(e) => setNamaKegiatan(e.target.value)}
                                        placeholder="Contoh: Wisuda Sarjana & Magister Tahun Akademik 2025/2026"
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Tanggal Peliputan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={tanggalKegiatan}
                                            onChange={(e) => setTanggalKegiatan(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Waktu Peliputan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={waktuPeliputan}
                                            onChange={(e) => setWaktuPeliputan(e.target.value)}
                                            placeholder="Contoh: 08.30 - 12.00 WIB"
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Pimpinan / Tamu yang Hadir / Interview <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pimpinanTamuHadir}
                                        onChange={(e) => setPimpinanTamuHadir(e.target.value)}
                                        placeholder="Sebutkan pimpinan universitas, menteri, atau narasumber penting yang hadir"
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Rundown Acara <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={rundownAcara}
                                        onChange={(e) => setRundownAcara(e.target.value)}
                                        placeholder="Tuliskan susunan acara secara ringkas (atau lampirkan di berkas pendukung)..."
                                        required
                                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* BERKAS & SURAT PERMOHONAN                                      */}
                    {/* ============================================================== */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <span>
                                    {['S', 'M'].includes(serviceCode) ? (
                                        <>
                                            Unggah Berkas Pendukung & Surat Permohonan{' '}
                                            <span className="text-rose-500 font-bold">*Wajib Surat Pimpinan</span>
                                        </>
                                    ) : (
                                        <>
                                            Unggah Berkas Pendukung{' '}
                                            <span className="text-slate-400 font-normal">(Opsional)</span>
                                        </>
                                    )}
                                </span>
                            </label>
                            <span className="text-[10px] text-slate-400">PDF, JPG, PNG, DOCX (Maks 10MB)</span>
                        </div>
                        {['S', 'M'].includes(serviceCode) ? (
                            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                                <strong>Catatan:</strong> Wajib menyertakan <strong>Surat Permohonan resmi dari Pimpinan Unit Kerja</strong> (Dekan / Kepala Biro / Direktur) sesuai Syarat & Ketentuan.
                            </p>
                        ) : (
                            <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                <strong>Catatan:</strong> Lampiran berkas bersifat opsional. Anda dapat menyertakan dokumen pendukung seperti draf materi, referensi desain, rundown acara, atau dokumen terkait jika ada.
                            </p>
                        )}
                        <FileUploader files={files} setFiles={setFiles} />
                    </div>

                    {/* Tombol Submit */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center space-x-2 disabled:opacity-60 cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                            <span>{submitting ? 'Mengirim Formulir...' : 'Kirim Permohonan'}</span>
                        </button>
                    </div>
                </form>
            </SplitScreenLayout>
        </div>
    );
}

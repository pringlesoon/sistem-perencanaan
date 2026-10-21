import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SplitScreenLayout from '../components/SplitScreenLayout';
import DateTimePicker from '../components/DateTimePicker';
import FileUploader from '../components/FileUploader';
import CustomSelect from '../components/CustomSelect';
import api from '../services/api';
import TimePicker from '../components/TimePicker';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';
import { 
    Send, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    Sparkles, 
    Calendar,
    Clock,
    MapPin,
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
    Trash2,
    Search,
    X,
    UserCheck
} from 'lucide-react';

const SERVICES_LIST = [
    { code: 'D', name: 'Layanan Desain Grafis' },
    { code: 'P', name: 'Layanan Publikasi Website & Social Media' },
    { code: 'S', name: 'Layanan Permohonan Alat Promosi' },
    { code: 'M', name: 'Layanan Multimedia & Dokumentasi' },
    { code: 'L', name: 'Layanan Peliputan Berita' },
];

export default function RequestFormPage({ serviceCode, onSelectService, onBack, onSuccess }) {
    const { user } = useAuth();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successTicket, setSuccessTicket] = useState(null);

    // Cek pembatasan akses layanan eksklusif (Alat Promosi & Multimedia) untuk role User
    useEffect(() => {
        if (user?.role === 'User' && (serviceCode === 'S' || serviceCode === 'M')) {
            Swal.fire({
                icon: 'warning',
                title: 'Akses Terbatas',
                text: 'Mohon maaf, pengajuan layanan ini tidak dapat dilakukan secara langsung oleh akun Anda. Silakan hubungi PIC Layanan atau bagian Tata Usaha (TU) di fakultas Anda masing-masing untuk bantuan pengajuan.',
                confirmButtonColor: '#4f46e5',
                confirmButtonText: 'Kembali ke Layanan Lain',
            }).then(() => {
                if (onSelectService) {
                    onSelectService('D');
                } else if (onBack) {
                    onBack();
                }
            });
        }
    }, [serviceCode, user]);

    const handleDropdownChange = (newCode) => {
        if (newCode === serviceCode) return;

        // Jika role User memilih Alat Promosi (S) atau Multimedia (M)
        if (user?.role === 'User' && (newCode === 'S' || newCode === 'M')) {
            Swal.fire({
                icon: 'warning',
                title: 'Akses Terbatas',
                text: 'Mohon maaf, pengajuan layanan ini tidak dapat dilakukan secara langsung oleh akun Anda. Silakan hubungi PIC Layanan atau bagian Tata Usaha (TU) di fakultas Anda masing-masing untuk bantuan pengajuan.',
                confirmButtonColor: '#4f46e5',
                confirmButtonText: 'Mengerti',
            });
            return; // Cegah form untuk dilanjutkan!
        }

        if (onSelectService) {
            onSelectService(newCode);
        }
    };

    // Pastikan serviceCode tersimpan di localStorage dan URL hash agar saat refresh tetap di form layanan ini
    useEffect(() => {
        if (serviceCode) {
            localStorage.setItem('sapt_active_service', serviceCode);
            try {
                const currentHash = window.location.hash.replace(/^#\/?/, '').trim();
                if (!currentHash.includes(serviceCode)) {
                    window.location.hash = `request-form/${serviceCode}`;
                }
            } catch (e) {}
        }
    }, [serviceCode]);

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

    // Fitur "On Behalf Of" (Mewakili Pemohon) untuk Tata Usaha, PIC, dan SuperAdmin
    const canRequestOnBehalf = user?.role === 'Tata Usaha' || user?.role?.toLowerCase() === 'tata_usaha' || user?.role === 'PIC' || user?.role?.toLowerCase() === 'pic' || user?.role === 'SuperAdmin';
    const [requestedForUser, setRequestedForUser] = useState(null);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userDropdownRef = useRef(null);

    // Debounced search user dari server
    useEffect(() => {
        if (!canRequestOnBehalf) return;

        const delayDebounce = setTimeout(async () => {
            try {
                setIsSearchingUsers(true);
                const res = await api.get('/users/search', {
                    params: { search: userSearchQuery.trim() }
                });
                if (res.data?.status === 'success') {
                    setUserSearchResults(res.data.data || []);
                }
            } catch (err) {
                console.error('Failed to search users:', err);
            } finally {
                setIsSearchingUsers(false);
            }
        }, 250);

        return () => clearTimeout(delayDebounce);
    }, [userSearchQuery, canRequestOnBehalf]);

    // Menutup dropdown user saat klik di luar komponen
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectUser = (selected) => {
        setRequestedForUser(selected);
        setShowUserDropdown(false);
        setUserSearchQuery('');
        // Auto-fill identitas pemohon sesuai data user yang dipilih
        if (selected.name) setNamaPemohon(selected.name);
        if (selected.unit_kerja) setUnitPemohon(selected.unit_kerja);
    };

    const handleClearSelectedUser = () => {
        setRequestedForUser(null);
        setUserSearchQuery('');
    };

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
    const [deadlineMm, setDeadlineMm] = useState('');

    // Klasifikasi jenis kebutuhan Multimedia:
    // 1. Produksi (memerlukan booking studio/alat & jadwal pelaksanaan):
    const MM_PRODUKSI_ITEMS = [
        'Foto Dokumentasi',
        'Podcast',
        'Operator Live Streaming',
        'Video Dokumentasi'
    ];
    // 2. Pasca-Produksi / Deliverable (memerlukan Target Penyelesaian / Deadline hasil editor):
    const MM_PASCA_PRODUKSI_ITEMS = [
        'Video Promosi',
        'Editing Video'
    ];

    // Logika Kondisional:
    // - butuhJadwal: jika memilih item Produksi (atau default belum memilih)
    // - butuhTargetPenyelesaian: jika memilih item Pasca-Produksi
    // Jika memilih campuran (misal: "Podcast" + "Editing Video"), KEDUA BLOK MUNCUL BERSAMAAN!
    const mmButuhJadwal = jenisKebutuhanMm.length === 0
        || jenisKebutuhanMm.some((item) => MM_PRODUKSI_ITEMS.includes(item));
    const mmButuhTargetPenyelesaian = jenisKebutuhanMm.some((item) => MM_PASCA_PRODUKSI_ITEMS.includes(item));

    // Bersihkan data dari mode yang tidak aktif agar tidak tersimpan sia-sia
    useEffect(() => {
        if (!mmButuhJadwal && jenisKebutuhanMm.length > 0) {
            setTanggalProduksiMm('');
            setMmStartTime('');
            setMmEndTime('');
            setLokasiProduksiMm('');
            setMmValid(false);
        }
        if (!mmButuhTargetPenyelesaian) {
            setDeadlineMm('');
        }
    }, [mmButuhJadwal, mmButuhTargetPenyelesaian, jenisKebutuhanMm.length]);

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

        // Validasi pembatasan akses layanan eksklusif di frontend
        if (user?.role === 'User' && (serviceCode === 'S' || serviceCode === 'M')) {
            Swal.fire({
                icon: 'warning',
                title: 'Akses Terbatas',
                text: 'Mohon maaf, pengajuan layanan ini tidak dapat dilakukan secara langsung oleh akun Anda. Silakan hubungi PIC Layanan atau bagian Tata Usaha (TU) di fakultas Anda masing-masing untuk bantuan pengajuan.',
                confirmButtonColor: '#4f46e5',
                confirmButtonText: 'Mengerti',
            });
            return;
        }

        // Validasi identitas pemohon (umum untuk semua layanan)
        if (!namaPemohon.trim()) {
            setErrorMsg('Nama pemohon wajib diisi.');
            return;
        }
        if (!unitPemohon.trim()) {
            setErrorMsg('Unit Pemohon wajib diisi.');
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
            if (!namaKegiatan.trim()) {
                setErrorMsg('Nama kegiatan / program wajib diisi.');
                return;
            }
            if (!tanggalKegiatan) {
                setErrorMsg('Tanggal kegiatan wajib diisi.');
                return;
            }
            if (!waktuKegiatan) {
                setErrorMsg('Waktu kegiatan wajib diisi.');
                return;
            }
            if (!lokasiKegiatan.trim()) {
                setErrorMsg('Lokasi kegiatan wajib diisi.');
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
            if (!namaKegiatan.trim()) {
                setErrorMsg('Nama kegiatan yang ingin dipublikasikan wajib diisi.');
                return;
            }
            // Layanan Publikasi tidak memerlukan lokasi, sehingga Tanggal & Waktu WAJIB diisi
            if (!tanggalKegiatan) {
                setErrorMsg('Tanggal kegiatan publikasi wajib diisi.');
                return;
            }
            if (!waktuKegiatan) {
                setErrorMsg('Waktu kegiatan publikasi wajib diisi.');
                return;
            }
            if (!tanggalPublikasi) {
                setErrorMsg('Tanggal tayang / publikasi wajib diisi.');
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
            if (!namaKegiatan.trim()) {
                setErrorMsg('Nama kegiatan / program alat promosi wajib diisi.');
                return;
            }
            // Layanan Alat Promosi menggunakan lokasi: Tanggal, Waktu, Lokasi WAJIB diisi
            if (!tanggalKegiatan) {
                setErrorMsg('Tanggal kegiatan alat promosi wajib diisi.');
                return;
            }
            if (!waktuKegiatan) {
                setErrorMsg('Waktu kegiatan alat promosi wajib diisi.');
                return;
            }
            if (!lokasiKegiatan.trim()) {
                setErrorMsg('Lokasi kegiatan alat promosi wajib diisi.');
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
            if (!namaKegiatan.trim()) {
                setErrorMsg('Nama kegiatan multimedia wajib diisi.');
                return;
            }
            if (mmButuhJadwal) {
                if (!tanggalProduksiMm) {
                    setErrorMsg('Tanggal pelaksanaan/produksi (booking ruangan/alat) wajib diisi.');
                    return;
                }
                if (!mmStartTime || !mmEndTime) {
                    setErrorMsg('Jam mulai dan jam selesai multimedia wajib dipilih.');
                    return;
                }
                if (!lokasiProduksiMm.trim()) {
                    setErrorMsg('Lokasi produksi / ruangan / alat multimedia wajib diisi.');
                    return;
                }
                if (!mmValid) {
                    setErrorMsg('Jadwal multimedia tidak valid (tidak boleh bentrok dengan jadwal lain).');
                    return;
                }
            }
            if (mmButuhTargetPenyelesaian) {
                if (!deadlineMm) {
                    setErrorMsg('Target penyelesaian / deadline hasil akhir video/editing wajib diisi.');
                    return;
                }
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
            if (!namaKegiatan.trim()) {
                setErrorMsg('Nama kegiatan peliputan wajib diisi.');
                return;
            }
            // Layanan Peliputan menggunakan lokasi: Tanggal, Waktu, Lokasi WAJIB diisi
            if (!tanggalKegiatan) {
                setErrorMsg('Tanggal peliputan wajib diisi.');
                return;
            }
            if (!waktuKegiatan && !waktuPeliputan) {
                setErrorMsg('Waktu peliputan wajib diisi.');
                return;
            }
            if (!lokasiKegiatan.trim()) {
                setErrorMsg('Lokasi kegiatan peliputan wajib diisi.');
                return;
            }
            if (!pimpinanTamuHadir.trim()) {
                setErrorMsg('Pimpinan / tamu yang hadir / interview wajib diisi.');
                return;
            }
            if (!rundownAcara.trim()) {
                setErrorMsg('Rundown acara peliputan wajib diisi.');
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
            // Tanggal yang dijadikan acuan timeline utama permohonan
            finalTanggalDibutuhkan = deadlineMm || tanggalProduksiMm;
            Object.assign(formDataPayload, {
                jenis_kebutuhan: jenisKebutuhanMm,
                unit_pemohon: unitPemohon,
                no_whatsapp_pemohon: noWhatsappPemohon,
                nama_kegiatan: namaKegiatan,
                lokasi_kegiatan: lokasiProduksiMm || '',
                nama_pic_kegiatan: namaPicKegiatan,
                no_whatsapp_pic: noWhatsappPic,
                konsep_konten: konsepKontenMm,
                butuh_penjadwalan: mmButuhJadwal,
                butuh_target_penyelesaian: mmButuhTargetPenyelesaian,
                ...(mmButuhJadwal
                    ? {
                        tanggal_kegiatan: tanggalProduksiMm,
                        waktu_kegiatan: `${mmStartTime} - ${mmEndTime}`,
                        tanggal_produksi: tanggalProduksiMm,
                        lokasi_produksi: lokasiProduksiMm,
                        jam_mulai: mmStartTime,
                        jam_selesai: mmEndTime,
                    }
                    : {}),
                ...(mmButuhTargetPenyelesaian
                    ? {
                        deadline: deadlineMm,
                        target_penyelesaian: deadlineMm,
                    }
                    : {}),
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
                tanggal_kegiatan: tanggalKegiatan,
                tanggal_peliputan: tanggalKegiatan,
                waktu_peliputan: waktuPeliputan || waktuKegiatan,
                waktu_kegiatan: waktuPeliputan || waktuKegiatan,
                lokasi_kegiatan: lokasiKegiatan,
                nama_pic_kegiatan: namaPicKegiatan,
                no_whatsapp_pic: noWhatsappPic,
                rundown_acara: rundownAcara,
                pimpinan_tamu_hadir: pimpinanTamuHadir,
            });
        }

        if (requestedForUser?.id) {
            formDataPayload.requested_for_id = requestedForUser.id;
            formDataPayload.requested_for_name = requestedForUser.name;
            formDataPayload.requested_for_username = requestedForUser.username;
            formDataPayload.requested_for_unit = requestedForUser.unit_kerja;
        }

        formDataPayload.nama_pemohon = namaPemohon;
        formDataPayload.unit_pemohon = unitPemohon;
        formDataPayload.no_whatsapp_pemohon = noWhatsappPemohon;

        const data = new FormData();
        data.append('service_code', serviceCode);
        data.append('judul_permohonan', finalJudul);
        data.append('deskripsi_kebutuhan', finalDeskripsi);
        if (requestedForUser?.id) {
            data.append('requested_for_id', requestedForUser.id);
        }
        if (finalTanggalDibutuhkan) {
            data.append('tanggal_dibutuhkan', finalTanggalDibutuhkan);
        }
        data.append('form_data', JSON.stringify(formDataPayload));

        // Format khusus untuk service S dan M agar kompatibel dengan tabel relasi detail
        if (serviceCode === 'M' && mmButuhJadwal) {
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
                    <label htmlFor="service-dropdown-select" className="text-xs font-bold text-slate-500">
                        Pilihan Layanan:
                    </label>
                    <div className="relative">
                        <select
                            id="service-dropdown-select"
                            value={serviceCode}
                            onChange={(e) => handleDropdownChange(e.target.value)}
                            className="px-3 py-1.5 text-xs font-extrabold bg-white border border-indigo-200 rounded-xl shadow-xs text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            {SERVICES_LIST.map((svc) => (
                                <option key={svc.code} value={svc.code}>
                                    {svc.name}
                                </option>
                            ))}
                        </select>
                    </div>
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
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                                <span>1. Identitas Unit Pemohon</span>
                            </div>
                            {canRequestOnBehalf && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    Akses Khusus: {user?.role}
                                </span>
                            )}
                        </div>

                        {/* Fitur On Behalf Of: Pemohon Sebenarnya (Opsional) - Khusus Tata Usaha, PIC, & SuperAdmin */}
                        {canRequestOnBehalf && (
                            <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 to-blue-50/70 border border-indigo-200/80 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                        <span>Pemohon Sebenarnya (Opsional)</span>
                                    </label>
                                    <span className="text-[10px] text-indigo-600 font-semibold bg-white/80 border border-indigo-200 px-2 py-0.5 rounded-md shadow-2xs">
                                        Mewakili User Lain
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Jika Anda mengajukan permohonan ini untuk mewakili pihak lain (dosen/tendik/mahasiswa), cari dan pilih akun pemohon di bawah ini. Tiket akan otomatis terhubung dan dapat dipantau di halaman Tracking milik user tersebut.
                                </p>

                                {requestedForUser ? (
                                    <div className="flex items-center justify-between p-2.5 bg-white border-2 border-indigo-300 rounded-xl shadow-xs">
                                        <div className="flex items-center space-x-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                                <UserCheck className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-900 truncate flex items-center space-x-1.5">
                                                    <span>{requestedForUser.name}</span>
                                                    <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-semibold">
                                                        {requestedForUser.username}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate">
                                                    {requestedForUser.unit_kerja || 'Unit Kerja tidak diset'} • {requestedForUser.role}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleClearSelectedUser}
                                            className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors text-xs font-semibold flex items-center space-x-1 shrink-0 ml-2"
                                            title="Batal mewakili user ini"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            <span>Batal</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative" ref={userDropdownRef}>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={userSearchQuery}
                                                onChange={(e) => {
                                                    setUserSearchQuery(e.target.value);
                                                    setShowUserDropdown(true);
                                                }}
                                                onFocus={() => setShowUserDropdown(true)}
                                                placeholder="Ketik nama, NIP, NPM, atau unit kerja pemohon asli..."
                                                className="w-full pl-9 pr-9 py-2 bg-white rounded-xl border border-indigo-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                            />
                                            <Search className="w-4 h-4 text-indigo-500 absolute left-3 top-2.5 pointer-events-none" />
                                            {isSearchingUsers ? (
                                                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin absolute right-3 top-2.5" />
                                            ) : userSearchQuery ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setUserSearchQuery('')}
                                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            ) : null}
                                        </div>

                                        {showUserDropdown && (
                                            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95">
                                                {userSearchResults.length > 0 ? (
                                                    userSearchResults.map((u) => (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            onClick={() => handleSelectUser(u)}
                                                            className="w-full text-left p-2.5 hover:bg-indigo-50/70 transition-colors flex items-center justify-between group cursor-pointer"
                                                        >
                                                            <div className="min-w-0 pr-2">
                                                                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 flex items-center space-x-1.5">
                                                                    <span>{u.name}</span>
                                                                    <span className="text-[10px] text-slate-400 font-normal">({u.username})</span>
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 truncate">
                                                                    {u.unit_kerja || 'Unit Kerja tidak diset'} • {u.role}
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-2 py-0.5 rounded-md shrink-0 transition-colors">
                                                                Pilih
                                                            </span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-center text-xs text-slate-400">
                                                        {isSearchingUsers ? 'Mencari pengguna...' : 'Tidak ada user ditemukan. Coba kata kunci lain.'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
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
                                    Unit Pemohon <span className="text-rose-500">*</span>
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
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Tanggal Kegiatan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={tanggalKegiatan}
                                            onChange={(e) => setTanggalKegiatan(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs font-medium text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Waktu Kegiatan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <TimePicker
                                            value={waktuKegiatan}
                                            onChange={setWaktuKegiatan}
                                            placeholder="Pilih Waktu (WIB)"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Lokasi Kegiatan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={lokasiKegiatan}
                                            onChange={(e) => setLokasiKegiatan(e.target.value)}
                                            placeholder="Contoh: Auditorium Lt. 12"
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs font-medium text-slate-800"
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
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-sky-600" />
                                            <span>Tanggal Kegiatan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={tanggalKegiatan}
                                            onChange={(e) => setTanggalKegiatan(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs font-medium text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                                            <span>Waktu Kegiatan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <TimePicker
                                            value={waktuKegiatan}
                                            onChange={setWaktuKegiatan}
                                            placeholder="Pilih Waktu (WIB)"
                                            required
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
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Tanggal Kegiatan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={tanggalKegiatan}
                                            onChange={(e) => setTanggalKegiatan(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs font-medium text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Waktu Kegiatan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <TimePicker
                                            value={waktuKegiatan}
                                            onChange={setWaktuKegiatan}
                                            placeholder="Pilih Waktu (WIB)"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Lokasi Kegiatan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={lokasiKegiatan}
                                            onChange={(e) => setLokasiKegiatan(e.target.value)}
                                            placeholder="Contoh: Ruang Senat Lt. 1"
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs font-medium text-slate-800"
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
                                        'Podcast',
                                        'Video Promosi',
                                        'Editing Video',
                                        'Operator Live Streaming',
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

                                {/* Blok 1: Penjadwalan & Booking Ruangan/Alat (Produksi) */}
                                {mmButuhJadwal && (
                                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-emerald-700" />
                                            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                                                Penjadwalan & Peminjaman Ruangan/Alat
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-emerald-800">
                                            Digunakan untuk mencatat tanggal dan jam pelaksanaan syuting/rekaman serta booking studio podcast atau alat multimedia.
                                        </p>
                                        <DateTimePicker
                                            selectedDate={tanggalProduksiMm}
                                            setSelectedDate={setTanggalProduksiMm}
                                            startTime={mmStartTime}
                                            setStartTime={setMmStartTime}
                                            endTime={mmEndTime}
                                            setEndTime={setMmEndTime}
                                            maxDurationMinutes={null}
                                            onValidationChange={(val) => setMmValid(val.isValid)}
                                        />
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Lokasi Produksi / Ruangan / Alat</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={lokasiProduksiMm}
                                                onChange={(e) => setLokasiProduksiMm(e.target.value)}
                                                placeholder="Ketik lokasi produksi, ruangan, atau alat yang dibutuhkan..."
                                                required
                                                className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400 outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Blok 2: Target Penyelesaian / Deadline (Pasca-Produksi / Editing) */}
                                {mmButuhTargetPenyelesaian && (
                                    <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4 text-blue-700" />
                                            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                                                Target Penyelesaian (Deadline Hasil Editing / Video)
                                            </span>
                                        </div>
                                        <div className="flex items-start space-x-2 text-[11px] text-blue-800">
                                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-600" />
                                            <span>
                                                Tentukan kapan hasil akhir dari video atau editing tersebut harus selesai dikerjakan oleh tim multimedia.
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                Tanggal Target Selesai (Deadline) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={deadlineMm}
                                                onChange={(e) => setDeadlineMm(e.target.value)}
                                                required
                                                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}

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
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    {['Wawancara', 'Penulisan Berita', 'Meliput Kegiatan'].map((item) => (
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
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Tanggal Peliputan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={tanggalKegiatan}
                                            onChange={(e) => setTanggalKegiatan(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs font-medium text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Waktu Peliputan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <TimePicker
                                            value={waktuKegiatan || waktuPeliputan}
                                            onChange={(val) => {
                                                setWaktuKegiatan(val);
                                                setWaktuPeliputan(val);
                                            }}
                                            placeholder="Pilih Waktu (WIB)"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Lokasi Kegiatan</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={lokasiKegiatan}
                                            onChange={(e) => setLokasiKegiatan(e.target.value)}
                                            placeholder="Contoh: Auditorium Ar-Rahman Lt. 12"
                                            required
                                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs font-medium text-slate-800"
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

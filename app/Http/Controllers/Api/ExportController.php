<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permohonan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    /**
     * Ekspor Data Permohonan Terfilter ke CSV sesuai layanan
     */
    public function csv(Request $request): StreamedResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->hasAdminAccess() && !$user->isPic())) {
            abort(403, 'Akses ekspor hanya untuk Admin, Super Admin, dan PIC.');
        }

        $query = $this->buildFilteredQuery($request);
        $serviceCode = $this->resolveServiceCode($request, $user);
        $config = $this->getServiceConfig($serviceCode);

        $serviceLabel = $config['label'];
        $fileName = 'Laporan_' . str_replace(' ', '_', $serviceLabel) . '_' . Carbon::now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query, $config) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM untuk kompatibilitas Excel
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header Baris Utama
            fputcsv($handle, array_merge($config['headers'], ['Riwayat Perubahan Status (Ringkasan)']));

            $query->chunk(150, function ($rows) use ($handle, $config) {
                foreach ($rows as $row) {
                    $rowData = ($config['extractor'])($row);

                    // Ringkasan Riwayat Status
                    $historySummary = $row->statusHistories->map(function ($sh) {
                        $time = $sh->created_at ? $sh->created_at->format('d/m/Y H:i') : '-';
                        $by = $sh->user?->name ?? 'Sistem';
                        $catatan = $sh->catatan ? " ({$sh->catatan})" : "";
                        return "[{$time}] {$sh->status_sebelumnya} -> {$sh->status_baru} oleh {$by}{$catatan}";
                    })->implode(' | ');

                    $rowData[] = $historySummary;
                    fputcsv($handle, $rowData);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Ekspor Data Permohonan & Riwayat Status ke format Excel Spreadsheet XML
     * Menghasilkan Multi-Worksheet:
     * Sheet 1: Data Permohonan (tabel sesuai spesifikasi layanannya)
     * Sheet 2: Riwayat Status Kronologis (log perubahan status seluruh permohonan terkait)
     */
    public function excel(Request $request): StreamedResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->hasAdminAccess() && !$user->isPic())) {
            abort(403, 'Akses ekspor hanya untuk Admin, Super Admin, dan PIC.');
        }

        $query = $this->buildFilteredQuery($request);
        $serviceCode = $this->resolveServiceCode($request, $user);
        $config = $this->getServiceConfig($serviceCode);

        $serviceLabel = $config['label'];
        $fileName = 'Tracking_Permohonan_' . str_replace(' ', '_', $serviceLabel) . '_' . Carbon::now()->format('Ymd_His') . '.xls';

        $headers = [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query, $config, $serviceLabel) {
            echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
            echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
            echo ' xmlns:o="urn:schemas-microsoft-com:office:office"' . "\n";
            echo ' xmlns:x="urn:schemas-microsoft-com:office:excel"' . "\n";
            echo ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' . "\n";

            // Definisi Styles
            echo '<Styles>' . "\n";
            echo '  <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="10"/><Alignment ss:Vertical="Center"/></Style>' . "\n";
            echo '  <Style ss:ID="MainTitle"><Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#1E1B4B"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>' . "\n";
            echo '  <Style ss:ID="SubTitle"><Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#475569"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>' . "\n";
            echo '  <Style ss:ID="HeaderCol">' . "\n";
            echo '    <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>' . "\n";
            echo '    <Interior ss:Color="#4338CA" ss:Pattern="Solid"/>' . "\n";
            echo '    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>' . "\n";
            echo '    <Borders>' . "\n";
            echo '      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#312E81"/>' . "\n";
            echo '      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#312E81"/>' . "\n";
            echo '      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#312E81"/>' . "\n";
            echo '      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#312E81"/>' . "\n";
            echo '    </Borders>' . "\n";
            echo '  </Style>' . "\n";
            echo '  <Style ss:ID="HeaderColGreen">' . "\n";
            echo '    <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>' . "\n";
            echo '    <Interior ss:Color="#059669" ss:Pattern="Solid"/>' . "\n";
            echo '    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>' . "\n";
            echo '    <Borders>' . "\n";
            echo '      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>' . "\n";
            echo '      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>' . "\n";
            echo '      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>' . "\n";
            echo '      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>' . "\n";
            echo '    </Borders>' . "\n";
            echo '  </Style>' . "\n";
            echo '  <Style ss:ID="CellLeft"><Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>' . "\n";
            echo '  <Style ss:ID="CellCenter"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>' . "\n";
            echo '  <Style ss:ID="CellStatusSelesai"><Font ss:Bold="1" ss:Color="#047857"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/></Borders></Style>' . "\n";
            echo '  <Style ss:ID="CellStatusDiproses"><Font ss:Bold="1" ss:Color="#1D4ED8"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/></Borders></Style>' . "\n";
            echo '  <Style ss:ID="CellStatusDitolak"><Font ss:Bold="1" ss:Color="#B91C1C"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/></Borders></Style>' . "\n";
            echo '  <Style ss:ID="CellStatusDefault"><Font ss:Bold="1" ss:Color="#475569"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>' . "\n";
            echo '</Styles>' . "\n";

            // -------------------------------------------------------------
            // WORKSHEET 1: DATA PERMOHONAN (TABEL SESUAI LAYANAN)
            // -------------------------------------------------------------
            $sheet1Name = mb_substr($config['sheet_name'], 0, 31);
            echo '<Worksheet ss:Name="' . htmlspecialchars($sheet1Name, ENT_QUOTES | ENT_XML1) . '">' . "\n";
            echo '<Table ss:DefaultRowHeight="20">' . "\n";

            // Kolom widths
            foreach ($config['widths'] as $w) {
                echo '<Column ss:Width="' . $w . '"/>' . "\n";
            }

            // Judul Lembar Kerja
            echo '<Row ss:Height="26"><Cell ss:StyleID="MainTitle"><Data ss:Type="String">LAPORAN TRACKING PERMOHONAN — ' . strtoupper(htmlspecialchars($serviceLabel, ENT_QUOTES | ENT_XML1)) . '</Data></Cell></Row>' . "\n";
            echo '<Row ss:Height="18"><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Diekspor pada: ' . Carbon::now()->format('d/m/Y H:i:s') . ' WIB | Sistem Layanan Marketing YARSI</Data></Cell></Row>' . "\n";
            echo '<Row ss:Height="10"></Row>' . "\n";

            // Table Header Baris
            echo '<Row ss:Height="26">' . "\n";
            foreach ($config['headers'] as $header) {
                echo '<Cell ss:StyleID="HeaderCol"><Data ss:Type="String">' . htmlspecialchars($header, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
            }
            echo '</Row>' . "\n";

            // Data Rows Sheet 1
            $q1 = clone $query;
            $q1->chunk(150, function ($rows) use ($config) {
                foreach ($rows as $row) {
                    $values = ($config['extractor'])($row);
                    $status = (string) $row->status;

                    $statusStyle = 'CellStatusDefault';
                    if ($status === 'Selesai') $statusStyle = 'CellStatusSelesai';
                    elseif (in_array($status, ['Ditolak', 'Batal'])) $statusStyle = 'CellStatusDitolak';
                    elseif (str_contains(strtolower($status), 'proses') || str_contains(strtolower($status), 'produksi')) $statusStyle = 'CellStatusDiproses';

                    echo '<Row ss:Height="22">' . "\n";
                    foreach ($values as $idx => $val) {
                        $strVal = (string) ($val ?? '-');
                        // Kolom status diberi style warna khusus
                        if ($idx === 1) { // Indeks ke-1 selalu status
                            echo '<Cell ss:StyleID="' . $statusStyle . '"><Data ss:Type="String">' . htmlspecialchars($strVal, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                        } elseif (in_array($idx, [0, 2, 3, 4, 9, 10, 11])) { // Nomor tiket, Lead time, Tanggal, waktu rata tengah
                            echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($strVal, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                        } else {
                            echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($strVal, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                        }
                    }
                    echo '</Row>' . "\n";
                }
            });

            echo '</Table>' . "\n";
            echo '</Worksheet>' . "\n";

            // -------------------------------------------------------------
            // WORKSHEET 2: RIWAYAT STATUS KRONOLOGIS
            // -------------------------------------------------------------
            echo '<Worksheet ss:Name="Riwayat Status Kronologis">' . "\n";
            echo '<Table ss:DefaultRowHeight="20">' . "\n";
            echo '<Column ss:Width="110"/>' . "\n"; // Nomor Tiket
            echo '<Column ss:Width="140"/>' . "\n"; // Layanan
            echo '<Column ss:Width="180"/>' . "\n"; // Judul / Kegiatan
            echo '<Column ss:Width="120"/>' . "\n"; // Waktu Perubahan
            echo '<Column ss:Width="110"/>' . "\n"; // Status Sebelum
            echo '<Column ss:Width="110"/>' . "\n"; // Status Baru
            echo '<Column ss:Width="260"/>' . "\n"; // Catatan / Alasan / Feedback
            echo '<Column ss:Width="130"/>' . "\n"; // Diubah Oleh
            echo '<Column ss:Width="170"/>' . "\n"; // Lampiran Hasil Revisi

            // Judul Lembar Kerja 2
            echo '<Row ss:Height="26"><Cell ss:StyleID="MainTitle"><Data ss:Type="String">RIWAYAT STATUS KRONOLOGIS PERMOHONAN</Data></Cell></Row>' . "\n";
            echo '<Row ss:Height="18"><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Catatan riwayat perjalanan status seluruh permohonan yang terfilter | Diekspor: ' . Carbon::now()->format('d/m/Y H:i:s') . ' WIB</Data></Cell></Row>' . "\n";
            echo '<Row ss:Height="10"></Row>' . "\n";

            // Header Baris Sheet 2
            echo '<Row ss:Height="26">' . "\n";
            $historyHeaders = [
                'Nomor Tiket',
                'Layanan',
                'Judul / Nama Kegiatan',
                'Waktu Perubahan',
                'Status Sebelumnya',
                'Status Baru',
                'Catatan / Alasan / Feedback',
                'Diubah Oleh',
                'Lampiran Hasil Revisi'
            ];
            foreach ($historyHeaders as $hh) {
                echo '<Cell ss:StyleID="HeaderColGreen"><Data ss:Type="String">' . htmlspecialchars($hh, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
            }
            echo '</Row>' . "\n";

            // Data Rows Sheet 2
            $q2 = clone $query;
            $q2->chunk(150, function ($rows) {
                foreach ($rows as $row) {
                    $tiket = $row->nomor_tiket;
                    $layanan = $row->service?->name ?? $row->kategori ?? '-';
                    $judul = $row->judul_permohonan ?? ($row->form_data['nama_kegiatan'] ?? '-');

                    if ($row->statusHistories->isEmpty()) {
                        // Jika belum ada history tersimpan, buatkan 1 baris status awal
                        echo '<Row ss:Height="20">' . "\n";
                        echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($tiket, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                        echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($layanan, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                        echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($judul, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                        echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($row->created_at->format('d/m/Y H:i'), ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                        echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">-</Data></Cell>' . "\n";
                        echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($row->status, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                        echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">Permohonan pertama kali diajukan</Data></Cell>' . "\n";
                        echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($row->user?->name ?? 'Pemohon', ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                        echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">-</Data></Cell>' . "\n";
                        echo '</Row>' . "\n";
                    } else {
                        foreach ($row->statusHistories as $sh) {
                            $waktu = $sh->created_at ? $sh->created_at->format('d/m/Y H:i') : '-';
                            $sebelum = $sh->status_sebelumnya ?: '-';
                            $baru = $sh->status_baru ?: '-';
                            $catatan = $sh->catatan ?: '-';
                            $diubahOleh = $sh->user?->name ?? 'Sistem';

                            // Kumpulkan nama file lampiran jika ada
                            $attachments = [];
                            if ($sh->attachments && $sh->attachments->isNotEmpty()) {
                                $attachments = $sh->attachments->map(fn($a) => $a->clean_file_name ?: $a->file_name)->filter()->toArray();
                            } elseif ($sh->file_name) {
                                $attachments[] = $sh->clean_file_name ?: $sh->file_name;
                            }
                            $lampiranStr = !empty($attachments) ? implode(', ', $attachments) : '-';

                            echo '<Row ss:Height="20">' . "\n";
                            echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($tiket, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                            echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($layanan, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                            echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($judul, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                            echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($waktu, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                            echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($sebelum, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                            echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($baru, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                            echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($catatan, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                            echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($diubahOleh, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                            echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($lampiranStr, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                            echo '</Row>' . "\n";
                        }
                    }
                }
            });

            echo '</Table>' . "\n";
            echo '</Worksheet>' . "\n";
            echo '</Workbook>' . "\n";
        }, 200, $headers);
    }

    /**
     * Tentukan kode layanan aktif
     */
    protected function resolveServiceCode(Request $request, $user): ?string
    {
        if ($user->isPic() && !$user->hasAdminAccess()) {
            return $user->pic_service_code ?: $request->input('service_code');
        }

        $code = $request->input('service_code');
        return ($code && $code !== 'Semua') ? $code : null;
    }

    /**
     * Konfigurasi tabel spesifik per layanan
     */
    protected function getServiceConfig(?string $code): array
    {
        switch ($code) {
            case 'D':
                return [
                    'label' => 'Layanan Desain Grafis',
                    'sheet_name' => 'Permohonan Desain Grafis',
                    'widths' => [100, 90, 80, 95, 95, 120, 140, 110, 160, 120, 120, 110, 110, 130, 140, 140, 170, 90, 110, 130, 140],
                    'headers' => [
                        'Nomor Tiket',
                        'Status',
                        'Lead Time',
                        'Tgl Diajukan',
                        'Deadline Desain',
                        'Nama Pemohon',
                        'Unit Kerja',
                        'No. WhatsApp Pemohon',
                        'Nama Kegiatan / Program',
                        'Tgl & Waktu Kegiatan',
                        'Lokasi Kegiatan',
                        'Nama PIC Kegiatan',
                        'No. WhatsApp PIC',
                        'Jenis Desain',
                        'Judul / Tema Desain',
                        'Tujuan Permintaan',
                        'Informasi yang Dicantumkan',
                        'Ukuran Desain',
                        'Media Penggunaan',
                        'Referensi Desain',
                        'Catatan Revisi / Alasan'
                    ],
                    'extractor' => function (Permohonan $row) {
                        $fd = $row->form_data ?? [];
                        $jenis = is_array($fd['jenis_desain'] ?? null) ? implode(', ', $fd['jenis_desain']) : ($fd['jenis_desain'] ?? '-');
                        if (!empty($fd['jenis_desain_lainnya'])) {
                            $jenis .= " ({$fd['jenis_desain_lainnya']})";
                        }
                        $tglKeg = $fd['tanggal_kegiatan'] ?? '-';
                        $wktKeg = $fd['waktu_kegiatan'] ?? '';
                        $tglWkt = trim("{$tglKeg} {$wktKeg}") ?: '-';

                        return [
                            $row->nomor_tiket,
                            $row->status,
                            $row->calculated_lead_time,
                            $row->created_at->format('d/m/Y H:i'),
                            $fd['deadline'] ?? ($row->tanggal_dibutuhkan ? $row->tanggal_dibutuhkan->format('d/m/Y') : '-'),
                            $fd['nama_pemohon'] ?? $row->user?->name ?? '-',
                            $fd['unit_pemohon'] ?? $row->user?->unit_kerja ?? '-',
                            $fd['no_whatsapp_pemohon'] ?? $row->user?->phone ?? '-',
                            $fd['nama_kegiatan'] ?? $row->judul_permohonan ?? '-',
                            $tglWkt,
                            $fd['lokasi_kegiatan'] ?? '-',
                            $fd['nama_pic_kegiatan'] ?? '-',
                            $fd['no_whatsapp_pic'] ?? '-',
                            $jenis,
                            $fd['judul_tema'] ?? '-',
                            $fd['tujuan_permintaan'] ?? '-',
                            $fd['informasi_dicantumkan'] ?? '-',
                            $fd['ukuran_desain'] ?? '-',
                            $fd['media_penggunaan'] ?? '-',
                            $fd['referensi_desain'] ?? '-',
                            $row->catatan_revisi ?: '-'
                        ];
                    }
                ];

            case 'P':
                return [
                    'label' => 'Layanan Publikasi Website & Medsos',
                    'sheet_name' => 'Permohonan Publikasi',
                    'widths' => [100, 90, 80, 95, 95, 120, 140, 110, 160, 120, 110, 110, 130, 180, 120, 140, 140],
                    'headers' => [
                        'Nomor Tiket',
                        'Status',
                        'Lead Time',
                        'Tgl Diajukan',
                        'Tgl Tayang Publikasi',
                        'Nama Pemohon',
                        'Unit Kerja',
                        'No. WhatsApp Pemohon',
                        'Nama Kegiatan',
                        'Tgl & Waktu Kegiatan',
                        'PIC Publikasi',
                        'Kontak PIC',
                        'Media Publikasi',
                        'Isi Caption',
                        'Tag / Mention',
                        'Link Google Drive',
                        'Catatan Revisi / Alasan'
                    ],
                    'extractor' => function (Permohonan $row) {
                        $fd = $row->form_data ?? [];
                        $media = is_array($fd['media_publikasi'] ?? null) ? implode(', ', $fd['media_publikasi']) : ($fd['media_publikasi'] ?? '-');
                        $tglKeg = $fd['tanggal_kegiatan'] ?? '-';
                        $wktKeg = $fd['waktu_kegiatan'] ?? '';
                        $tglWkt = trim("{$tglKeg} {$wktKeg}") ?: '-';

                        return [
                            $row->nomor_tiket,
                            $row->status,
                            $row->calculated_lead_time,
                            $row->created_at->format('d/m/Y H:i'),
                            $fd['tanggal_publikasi'] ?? ($row->tanggal_dibutuhkan ? $row->tanggal_dibutuhkan->format('d/m/Y') : '-'),
                            $fd['nama_pemohon'] ?? $row->user?->name ?? '-',
                            $fd['unit_pemohon'] ?? $row->user?->unit_kerja ?? '-',
                            $fd['no_whatsapp_pemohon'] ?? $row->user?->phone ?? '-',
                            $fd['nama_kegiatan'] ?? $row->judul_permohonan ?? '-',
                            $tglWkt,
                            $fd['nama_pic_publikasi'] ?? ($fd['nama_pic_kegiatan'] ?? '-'),
                            $fd['kontak_pic_publikasi'] ?? ($fd['no_whatsapp_pic'] ?? '-'),
                            $media,
                            $fd['isi_caption'] ?? '-',
                            $fd['tag_mention'] ?? '-',
                            $fd['link_drive'] ?? '-',
                            $row->catatan_revisi ?: '-'
                        ];
                    }
                ];

            case 'S':
                return [
                    'label' => 'Layanan Alat Promosi & Suvenir',
                    'sheet_name' => 'Permohonan Alat Promosi',
                    'widths' => [100, 90, 80, 95, 95, 120, 140, 110, 160, 130, 120, 120, 110, 110, 180, 80, 80, 80, 95, 140],
                    'headers' => [
                        'Nomor Tiket',
                        'Status',
                        'Lead Time',
                        'Tgl Diajukan',
                        'Tgl Dibutuhkan',
                        'Nama Pemohon',
                        'Unit Kerja',
                        'No. WhatsApp Pemohon',
                        'Nama Kegiatan / Program',
                        'Kategori Kegiatan Promosi',
                        'Tgl & Waktu Kegiatan',
                        'Lokasi Kegiatan',
                        'PIC Kegiatan',
                        'No. WhatsApp PIC',
                        'Rincian Item Suvenir (Diminta)',
                        'Total Minta',
                        'Qty Auto',
                        'Qty Approval',
                        'Status Approval',
                        'Catatan Approver / Revisi'
                    ],
                    'extractor' => function (Permohonan $row) {
                        $fd = $row->form_data ?? [];
                        $s = $row->suvenirDetail;

                        // Rincian Item Suvenir
                        $itemsSummary = '';
                        $totalQty = 0;
                        if (!empty($fd['souvenir_items']) && is_array($fd['souvenir_items'])) {
                            $itemsSummary = collect($fd['souvenir_items'])->map(function ($it) {
                                return ($it['nama_item'] ?? '-') . ': ' . ($it['qty'] ?? 0);
                            })->implode(', ');
                            $totalQty = collect($fd['souvenir_items'])->sum('qty');
                        } elseif ($s) {
                            $itemsSummary = "{$s->nama_item} ({$s->qty_diminta})";
                            $totalQty = $s->qty_diminta;
                        }

                        $tglKeg = $fd['tanggal_kegiatan'] ?? '-';
                        $wktKeg = $fd['waktu_kegiatan'] ?? '';
                        $tglWkt = trim("{$tglKeg} {$wktKeg}") ?: '-';

                        return [
                            $row->nomor_tiket,
                            $row->status,
                            $row->calculated_lead_time,
                            $row->created_at->format('d/m/Y H:i'),
                            $fd['tanggal_dibutuhkan'] ?? ($row->tanggal_dibutuhkan ? $row->tanggal_dibutuhkan->format('d/m/Y') : '-'),
                            $fd['nama_pemohon'] ?? $row->user?->name ?? '-',
                            $fd['unit_pemohon'] ?? $row->user?->unit_kerja ?? '-',
                            $fd['no_whatsapp_pemohon'] ?? $row->user?->phone ?? '-',
                            $fd['nama_kegiatan'] ?? $row->judul_permohonan ?? '-',
                            $fd['kategori_kegiatan'] ?? ($fd['kategori_promosi_pilihan'] ?? '-'),
                            $tglWkt,
                            $fd['lokasi_kegiatan'] ?? '-',
                            $fd['nama_pic_kegiatan'] ?? '-',
                            $fd['no_whatsapp_pic'] ?? '-',
                            $itemsSummary ?: '-',
                            $totalQty,
                            $s?->qty_disetujui_otomatis ?? '-',
                            $s?->qty_perlu_approval ?? '-',
                            $s?->status_approval ?? '-',
                            $s?->catatan_approver ?: ($row->catatan_revisi ?: '-')
                        ];
                    }
                ];

            case 'M':
                return [
                    'label' => 'Layanan Multimedia & Dokumentasi',
                    'sheet_name' => 'Multimedia & Dokumentasi',
                    'widths' => [100, 90, 80, 95, 95, 90, 75, 130, 95, 120, 140, 110, 160, 110, 110, 150, 150, 120, 120, 130, 140],
                    'headers' => [
                        'Nomor Tiket',
                        'Status',
                        'Lead Time',
                        'Tgl Diajukan',
                        'Jadwal Pelaksanaan / Produksi',
                        'Jam Pelaksanaan',
                        'Durasi',
                        'Lokasi Produksi / Ruangan',
                        'Target Penyelesaian',
                        'Nama Pemohon',
                        'Unit Kerja',
                        'No. WhatsApp Pemohon',
                        'Nama Kegiatan / Program',
                        'PIC Kegiatan',
                        'No. WhatsApp PIC',
                        'Jenis Kebutuhan Multimedia',
                        'Konsep Konten',
                        'Narasumber / Talent',
                        'Output yang Diharapkan',
                        'Link Google Drive',
                        'Catatan Revisi / Alasan'
                    ],
                    'extractor' => function (Permohonan $row) {
                        $fd = $row->form_data ?? [];
                        $m = $row->multimediaDetail;

                        $jenis = is_array($fd['jenis_kebutuhan'] ?? null) ? implode(', ', $fd['jenis_kebutuhan']) : ($fd['jenis_kebutuhan'] ?? '-');
                        $jadwal = $m?->tanggal_pelaksanaan ? $m->tanggal_pelaksanaan->format('d/m/Y') : ($fd['tanggal_produksi'] ?? ($fd['tanggal_kegiatan'] ?? '-'));
                        $jam = $m ? "{$m->jam_mulai} - {$m->jam_selesai}" : (($fd['jam_mulai'] ?? '') ? "{$fd['jam_mulai']} - {$fd['jam_selesai']}" : ($fd['waktu_kegiatan'] ?? '-'));
                        $durasi = $m ? "{$m->durasi_menit} mnt" : '-';
                        $lokasi = $m?->lokasi_alat ?: ($fd['lokasi_produksi'] ?? ($fd['lokasi_kegiatan'] ?? '-'));
                        $deadline = $fd['deadline'] ?? ($fd['target_penyelesaian'] ?? ($row->tanggal_dibutuhkan ? $row->tanggal_dibutuhkan->format('d/m/Y') : '-'));

                        return [
                            $row->nomor_tiket,
                            $row->status,
                            $row->calculated_lead_time,
                            $row->created_at->format('d/m/Y H:i'),
                            $jadwal,
                            $jam,
                            $durasi,
                            $lokasi,
                            $deadline,
                            $fd['nama_pemohon'] ?? $row->user?->name ?? '-',
                            $fd['unit_pemohon'] ?? $row->user?->unit_kerja ?? '-',
                            $fd['no_whatsapp_pemohon'] ?? $row->user?->phone ?? '-',
                            $fd['nama_kegiatan'] ?? $row->judul_permohonan ?? '-',
                            $fd['nama_pic_kegiatan'] ?? '-',
                            $fd['no_whatsapp_pic'] ?? '-',
                            $jenis,
                            $fd['konsep_konten'] ?? '-',
                            $fd['narasumber_talent'] ?? '-',
                            $fd['output_diharapkan'] ?? '-',
                            $fd['link_drive'] ?? '-',
                            $row->catatan_revisi ?: '-'
                        ];
                    }
                ];

            case 'L':
                return [
                    'label' => 'Layanan Peliputan Berita',
                    'sheet_name' => 'Peliputan Berita',
                    'widths' => [100, 90, 80, 95, 95, 90, 130, 120, 140, 110, 160, 110, 110, 130, 150, 180, 140],
                    'headers' => [
                        'Nomor Tiket',
                        'Status',
                        'Lead Time',
                        'Tgl Diajukan',
                        'Tgl Peliputan',
                        'Waktu Peliputan',
                        'Lokasi Peliputan',
                        'Nama Pemohon',
                        'Unit Kerja',
                        'No. WhatsApp Pemohon',
                        'Nama Kegiatan Peliputan',
                        'PIC Kegiatan',
                        'No. WhatsApp PIC',
                        'Jenis Peliputan',
                        'Pimpinan / Tamu yang Hadir',
                        'Rundown Acara',
                        'Catatan Revisi / Alasan'
                    ],
                    'extractor' => function (Permohonan $row) {
                        $fd = $row->form_data ?? [];
                        $jenis = is_array($fd['jenis_peliputan'] ?? null) ? implode(', ', $fd['jenis_peliputan']) : ($fd['jenis_peliputan'] ?? '-');

                        return [
                            $row->nomor_tiket,
                            $row->status,
                            $row->calculated_lead_time,
                            $row->created_at->format('d/m/Y H:i'),
                            $fd['tanggal_peliputan'] ?? ($fd['tanggal_kegiatan'] ?? ($row->tanggal_dibutuhkan ? $row->tanggal_dibutuhkan->format('d/m/Y') : '-')),
                            $fd['waktu_peliputan'] ?? ($fd['waktu_kegiatan'] ?? '-'),
                            $fd['lokasi_kegiatan'] ?? '-',
                            $fd['nama_pemohon'] ?? $row->user?->name ?? '-',
                            $fd['unit_pemohon'] ?? $row->user?->unit_kerja ?? '-',
                            $fd['no_whatsapp_pemohon'] ?? $row->user?->phone ?? '-',
                            $fd['nama_kegiatan'] ?? $row->judul_permohonan ?? '-',
                            $fd['nama_pic_kegiatan'] ?? '-',
                            $fd['no_whatsapp_pic'] ?? '-',
                            $jenis,
                            $fd['pimpinan_tamu_hadir'] ?? '-',
                            $fd['rundown_acara'] ?? '-',
                            $row->catatan_revisi ?: '-'
                        ];
                    }
                ];

            default:
                return [
                    'label' => 'Semua Layanan',
                    'sheet_name' => 'Semua Permohonan',
                    'widths' => [100, 90, 80, 80, 130, 95, 95, 120, 140, 110, 160, 180, 130, 180, 140],
                    'headers' => [
                        'Nomor Tiket',
                        'Status',
                        'Lead Time',
                        'Kode Layanan',
                        'Nama Layanan',
                        'Tgl Diajukan',
                        'Tgl Dibutuhkan / Deadline',
                        'Nama Pemohon',
                        'Unit Kerja',
                        'No. WhatsApp Pemohon',
                        'Judul / Nama Kegiatan',
                        'Deskripsi / Rincian Kebutuhan',
                        'PIC Kegiatan / Kontak',
                        'Detail Khusus Layanan',
                        'Catatan Revisi / Alasan'
                    ],
                    'extractor' => function (Permohonan $row) {
                        $fd = $row->form_data ?? [];
                        $detailInfo = '-';
                        if ($row->multimediaDetail) {
                            $m = $row->multimediaDetail;
                            $detailInfo = "Jadwal: " . ($m->tanggal_pelaksanaan ? $m->tanggal_pelaksanaan->format('d/m/Y') : '-') . " ({$m->jam_mulai} - {$m->jam_selesai}), Durasi: {$m->durasi_menit} mnt, Lokasi: {$m->lokasi_alat}";
                        } elseif ($row->suvenirDetail) {
                            $s = $row->suvenirDetail;
                            $detailInfo = "Item: {$s->nama_item}, Minta: {$s->qty_diminta}, Auto: {$s->qty_disetujui_otomatis}, Need Approval: {$s->qty_perlu_approval}, Status Approval: {$s->status_approval}";
                        } elseif (!empty($fd['media_publikasi'])) {
                            $media = is_array($fd['media_publikasi']) ? implode(', ', $fd['media_publikasi']) : $fd['media_publikasi'];
                            $detailInfo = "Media: {$media}, Tgl Tayang: " . ($fd['tanggal_publikasi'] ?? '-');
                        } elseif (!empty($fd['jenis_desain'])) {
                            $j = is_array($fd['jenis_desain']) ? implode(', ', $fd['jenis_desain']) : $fd['jenis_desain'];
                            $detailInfo = "Desain: {$j}, Ukuran: " . ($fd['ukuran_desain'] ?? '-');
                        } elseif (!empty($fd['jenis_peliputan'])) {
                            $lp = is_array($fd['jenis_peliputan']) ? implode(', ', $fd['jenis_peliputan']) : $fd['jenis_peliputan'];
                            $detailInfo = "Peliputan: {$lp}, Tgl: " . ($fd['tanggal_peliputan'] ?? '-');
                        }

                        $picInfo = '-';
                        if (!empty($fd['nama_pic_kegiatan']) || !empty($fd['nama_pic_publikasi'])) {
                            $pNama = $fd['nama_pic_kegiatan'] ?? ($fd['nama_pic_publikasi'] ?? '');
                            $pKontak = $fd['no_whatsapp_pic'] ?? ($fd['kontak_pic_publikasi'] ?? '');
                            $picInfo = trim("{$pNama} ({$pKontak})");
                        }

                        return [
                            $row->nomor_tiket,
                            $row->status,
                            $row->calculated_lead_time,
                            $row->service?->code ?? '-',
                            $row->service?->name ?? $row->kategori ?? '-',
                            $row->created_at->format('d/m/Y H:i'),
                            $row->tanggal_dibutuhkan ? $row->tanggal_dibutuhkan->format('d/m/Y') : ($fd['deadline'] ?? ($fd['tanggal_publikasi'] ?? '-')),
                            $fd['nama_pemohon'] ?? $row->user?->name ?? '-',
                            $fd['unit_pemohon'] ?? $row->user?->unit_kerja ?? '-',
                            $fd['no_whatsapp_pemohon'] ?? $row->user?->phone ?? '-',
                            $fd['nama_kegiatan'] ?? $row->judul_permohonan ?? '-',
                            $row->deskripsi_kebutuhan ?: '-',
                            $picInfo,
                            $detailInfo,
                            $row->catatan_revisi ?: '-'
                        ];
                    }
                ];
        }
    }

    /**
     * Helper query filter berdasarkan parameter request & otorisasi PIC
     */
    protected function buildFilteredQuery(Request $request)
    {
        $user = Auth::user();

        $query = Permohonan::with([
            'user',
            'service',
            'multimediaDetail',
            'suvenirDetail',
            'statusHistories' => function ($q) {
                $q->with(['user:id,name', 'attachments'])->orderBy('created_at', 'asc');
            }
        ])->orderBy('created_at', 'desc');

        // Jika user adalah PIC (bukan SuperAdmin / Admin), batasi hanya pada layanan miliknya
        if ($user && $user->isPic() && !$user->hasAdminAccess()) {
            $picCode = $user->pic_service_code;
            if ($picCode) {
                $query->whereHas('service', function ($q) use ($picCode) {
                    $q->where('code', $picCode);
                });
            }
        } elseif ($request->filled('service_code') && $request->service_code !== 'Semua') {
            $query->whereHas('service', function ($q) use ($request) {
                $q->where('code', $request->service_code);
            });
        }

        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        if ($request->has('is_archived')) {
            $isArchived = filter_var($request->input('is_archived'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_archived', $isArchived);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nomor_tiket', 'like', "%{$search}%")
                  ->orWhere('judul_permohonan', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('unit_kerja', 'like', "%{$search}%");
                  });
            });
        }

        return $query;
    }
}


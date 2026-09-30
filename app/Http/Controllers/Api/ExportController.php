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
     * Ekspor Data Permohonan Terfilter ke CSV (PRD FR-EXP-01, FR-EXP-02)
     */
    public function csv(Request $request): StreamedResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->isAdmin() && !$user->isSuperAdmin())) {
            abort(403, 'Akses ekspor hanya untuk Admin dan Super Admin.');
        }

        $query = $this->buildFilteredQuery($request);
        $fileName = 'Laporan_Permohonan_SAPT_' . Carbon::now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM untuk kompatibilitas Excel
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header Baris
            fputcsv($handle, [
                'Nomor Tiket',
                'Kode Layanan',
                'Kategori Layanan',
                'Nama Pemohon',
                'Unit Kerja Pemohon',
                'Judul Permohonan',
                'Deskripsi Kebutuhan',
                'Tanggal Diajukan',
                'Tanggal Dibutuhkan',
                'Status Saat Ini',
                'Lead Time',
                'Detail Tambahan',
            ]);

            $query->chunk(200, function ($rows) use ($handle) {
                foreach ($rows as $row) {
                    $detailInfo = '';
                    if ($row->multimediaDetail) {
                        $m = $row->multimediaDetail;
                        $detailInfo = "Jadwal: {$m->tanggal_pelaksanaan->format('d/m/Y')} ({$m->jam_mulai} - {$m->jam_selesai}), Durasi: {$m->durasi_menit} mnt, Lokasi: {$m->lokasi_alat}";
                    } elseif ($row->suvenirDetail) {
                        $s = $row->suvenirDetail;
                        $detailInfo = "Item: {$s->nama_item}, Minta: {$s->qty_diminta}, Auto: {$s->qty_disetujui_otomatis}, Need Approval: {$s->qty_perlu_approval}, Status Approval: {$s->status_approval}";
                    }

                    fputcsv($handle, [
                        $row->nomor_tiket,
                        $row->service?->code ?? '-',
                        $row->kategori,
                        $row->user?->name ?? '-',
                        $row->user?->unit_kerja ?? '-',
                        $row->judul_permohonan,
                        $row->deskripsi_kebutuhan,
                        $row->created_at->format('Y-m-d H:i:s'),
                        $row->tanggal_dibutuhkan ? $row->tanggal_dibutuhkan->format('Y-m-d') : '-',
                        $row->status,
                        $row->calculated_lead_time,
                        $detailInfo,
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Ekspor Data Permohonan Terfilter ke format Excel Spreadsheet XML
     */
    public function excel(Request $request): StreamedResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->isAdmin() && !$user->isSuperAdmin())) {
            abort(403, 'Akses ekspor hanya untuk Admin dan Super Admin.');
        }

        $query = $this->buildFilteredQuery($request);
        $fileName = 'Laporan_Permohonan_SAPT_' . Carbon::now()->format('Ymd_His') . '.xls';

        $headers = [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query) {
            echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
            echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
            echo ' xmlns:o="urn:schemas-microsoft-com:office:office"' . "\n";
            echo ' xmlns:x="urn:schemas-microsoft-com:office:excel"' . "\n";
            echo ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' . "\n";
            echo '<Worksheet ss:Name="Laporan Permohonan">' . "\n";
            echo '<Table>' . "\n";

            // Header row
            echo '<Row>' . "\n";
            $headers = ['Nomor Tiket', 'Layanan', 'Pemohon', 'Unit Kerja', 'Judul Permohonan', 'Tanggal Diajukan', 'Status', 'Lead Time', 'Keterangan Tambahan'];
            foreach ($headers as $h) {
                echo '<Cell><Data ss:Type="String">' . htmlspecialchars($h, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
            }
            echo '</Row>' . "\n";

            $query->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $detailInfo = '';
                    if ($row->multimediaDetail) {
                        $m = $row->multimediaDetail;
                        $detailInfo = "Jadwal: {$m->tanggal_pelaksanaan->format('d/m/Y')} ({$m->jam_mulai} - {$m->jam_selesai}), Durasi: {$m->durasi_menit} mnt";
                    } elseif ($row->suvenirDetail) {
                        $s = $row->suvenirDetail;
                        $detailInfo = "Item: {$s->nama_item}, Minta: {$s->qty_diminta} unit (Auto: {$s->qty_disetujui_otomatis})";
                    }

                    echo '<Row>' . "\n";
                    echo '<Cell><Data ss:Type="String">' . htmlspecialchars($row->nomor_tiket, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell><Data ss:Type="String">' . htmlspecialchars($row->kategori, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell><Data ss:Type="String">' . htmlspecialchars($row->user?->name ?? '-', ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell><Data ss:Type="String">' . htmlspecialchars($row->user?->unit_kerja ?? '-', ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell><Data ss:Type="String">' . htmlspecialchars($row->judul_permohonan, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell><Data ss:Type="String">' . htmlspecialchars($row->created_at->format('d/m/Y H:i'), ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell><Data ss:Type="String">' . htmlspecialchars($row->status, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell><Data ss:Type="String">' . htmlspecialchars($row->calculated_lead_time, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell><Data ss:Type="String">' . htmlspecialchars($detailInfo, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '</Row>' . "\n";
                }
            });

            echo '</Table>' . "\n";
            echo '</Worksheet>' . "\n";
            echo '</Workbook>' . "\n";
        }, 200, $headers);
    }

    /**
     * Helper query filter berdasarkan parameter request
     */
    protected function buildFilteredQuery(Request $request)
    {
        $query = Permohonan::with(['user', 'service', 'multimediaDetail', 'suvenirDetail'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        if ($request->filled('service_code') && $request->service_code !== 'Semua') {
            $query->whereHas('service', function ($q) use ($request) {
                $q->where('code', $request->service_code);
            });
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
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        return $query;
    }
}

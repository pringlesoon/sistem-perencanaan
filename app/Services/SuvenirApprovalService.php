<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Permohonan;
use App\Models\RequestSuvenirDetail;
use App\Models\Service;
use App\Models\ServiceConfig;
use App\Models\StatusHistory;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;

class SuvenirApprovalService
{
    /**
     * Hitung formula auto-approval sesuai PRD FR-SV-03
     */
    public function calculateQuota(int $qtyDiminta): array
    {
        $service = Service::where('code', 'S')->first();
        $limit = 20; // default jika belum ada config

        if ($service) {
            $config = ServiceConfig::where('service_id', $service->id)
                ->where('config_key', 'auto_approval_limit')
                ->first();
            if ($config) {
                $limit = (int) $config->config_value;
            }
        }

        $qtyDisetujuiOtomatis = min($qtyDiminta, $limit);
        $qtyPerluApproval = max($qtyDiminta - $limit, 0);

        $initialStatus = ($qtyPerluApproval > 0)
            ? 'Menunggu Approval Sebagian'
            : 'Diproses';

        return [
            'auto_approval_limit' => $limit,
            'qty_diminta' => $qtyDiminta,
            'qty_disetujui_otomatis' => $qtyDisetujuiOtomatis,
            'qty_perlu_approval' => $qtyPerluApproval,
            'initial_status' => $initialStatus,
        ];
    }

    /**
     * Penanganan Keputusan Approver (Setuju / Tolak untuk sisa kuota)
     */
    public function handleApproverDecision(
        Permohonan $permohonan,
        User $approver,
        string $decision, // 'approve' atau 'reject'
        ?string $catatan = null
    ): Permohonan {
        return DB::transaction(function () use ($permohonan, $approver, $decision, $catatan) {
            $detail = $permohonan->suvenirDetail;
            if (!$detail) {
                throw new Exception('Detail suvenir tidak ditemukan.');
            }

            $oldStatus = $permohonan->status;

            if ($decision === 'approve') {
                $detail->status_approval = 'Disetujui';
                $detail->approved_by = $approver->id;
                $detail->approved_at = Carbon::now();
                $detail->catatan_approver = $catatan ?? 'Persetujuan kuota tambahan disetujui penuh oleh Kepala Divisi.';
                $detail->save();

                $newStatus = 'Diproses';
                $permohonan->status = $newStatus;
                $permohonan->save();

                // Catat di Status History (append-only)
                StatusHistory::create([
                    'permohonan_id' => $permohonan->id,
                    'user_id' => $approver->id,
                    'status_sebelumnya' => $oldStatus,
                    'status_baru' => $newStatus,
                    'catatan' => "Sisa kuota {$detail->qty_perlu_approval} unit disetujui oleh Approver (" . $approver->name . "). Total disetujui: {$detail->qty_diminta} unit. " . ($catatan ? "Catatan: {$catatan}" : ""),
                ]);

                // Notifikasi ke Pemohon
                Notification::create([
                    'user_id' => $permohonan->user_id,
                    'permohonan_id' => $permohonan->id,
                    'title' => 'Permohonan Suvenir Disetujui: ' . $permohonan->nomor_tiket,
                    'message' => "Kuota tambahan suvenir Anda telah disetujui oleh Kepala Divisi. Permohonan kini berstatus Diproses.",
                    'type' => 'success',
                ]);
            } else {
                $detail->status_approval = 'Ditolak';
                $detail->approved_by = $approver->id;
                $detail->approved_at = Carbon::now();
                $detail->catatan_approver = $catatan ?? 'Permintaan tambahan kuota tidak disetujui. Hanya kuota otomatis yang dapat diproses.';
                $detail->save();

                // Status tetap Diproses untuk kuota otomatis atau Ditolak sesuai catatan
                $newStatus = ($detail->qty_disetujui_otomatis > 0) ? 'Diproses' : 'Ditolak';
                $permohonan->status = $newStatus;
                $permohonan->save();

                StatusHistory::create([
                    'permohonan_id' => $permohonan->id,
                    'user_id' => $approver->id,
                    'status_sebelumnya' => $oldStatus,
                    'status_baru' => $newStatus,
                    'catatan' => "Tambahan kuota ({$detail->qty_perlu_approval} unit) ditolak oleh Approver (" . $approver->name . "). Hanya kuota otomatis {$detail->qty_disetujui_otomatis} unit yang diberikan. " . ($catatan ? "Alasan: {$catatan}" : ""),
                ]);

                Notification::create([
                    'user_id' => $permohonan->user_id,
                    'permohonan_id' => $permohonan->id,
                    'title' => 'Pembaruan Kuota Suvenir: ' . $permohonan->nomor_tiket,
                    'message' => "Tambahan kuota suvenir tidak disetujui oleh Kepala Divisi. Hanya {$detail->qty_disetujui_otomatis} unit otomatis yang dapat diproses.",
                    'type' => 'warning',
                ]);
            }

            return $permohonan->fresh(['user', 'service', 'suvenirDetail', 'statusHistories']);
        });
    }
}

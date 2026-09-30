<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\InventoryLog;
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
     * Penanganan Keputusan Approver / Super Admin / PIC (Setuju Penuh / Setuju Sebagian / Tolak)
     */
    public function handleApproverDecision(
        Permohonan $permohonan,
        User $approver,
        string $decision, // 'approve', 'partial', atau 'reject'
        ?string $catatan = null,
        ?int $qtyDisetujui = null
    ): Permohonan {
        return DB::transaction(function () use ($permohonan, $approver, $decision, $catatan, $qtyDisetujui) {
            $detail = $permohonan->suvenirDetail;
            if (!$detail) {
                throw new Exception('Detail suvenir tidak ditemukan.');
            }

            $oldStatus = $permohonan->status;
            $approverRoleName = $approver->role === 'PIC' ? 'PIC Alat Promosi' : 'Super Admin';
            $approvedCount = 0;

            if ($decision === 'approve') {
                $detail->status_approval = 'Disetujui';
                $detail->approved_by = $approver->id;
                $detail->approved_at = Carbon::now();
                $detail->catatan_approver = $catatan ?? "Persetujuan kuota suvenir disetujui penuh oleh {$approverRoleName}.";
                $detail->save();

                $approvedCount = $detail->qty_diminta;

                $newStatus = 'Diproses';
                $permohonan->status = $newStatus;
                $permohonan->save();

                // Catat di Status History (append-only)
                StatusHistory::create([
                    'permohonan_id' => $permohonan->id,
                    'user_id' => $approver->id,
                    'status_sebelumnya' => $oldStatus,
                    'status_baru' => $newStatus,
                    'catatan' => "Sisa kuota {$detail->qty_perlu_approval} unit disetujui oleh {$approverRoleName} ({$approver->name}). Total disetujui: {$detail->qty_diminta} unit. " . ($catatan ? "Catatan: {$catatan}" : ""),
                ]);

                // Notifikasi ke Pemohon
                Notification::create([
                    'user_id' => $permohonan->user_id,
                    'permohonan_id' => $permohonan->id,
                    'title' => 'Permohonan Suvenir Disetujui: ' . $permohonan->nomor_tiket,
                    'message' => "Kuota penuh ({$detail->qty_diminta} unit) disetujui oleh {$approverRoleName}. Permohonan kini berstatus Diproses.",
                    'type' => 'success',
                ]);
            } elseif ($decision === 'partial') {
                $qty = $qtyDisetujui ?? $detail->qty_disetujui_otomatis;
                $detail->status_approval = 'Disetujui Sebagian';
                $detail->approved_by = $approver->id;
                $detail->approved_at = Carbon::now();
                $detail->qty_disetujui_otomatis = $qty;
                $detail->catatan_approver = $catatan ?? "Disetujui sebagian sebanyak {$qty} dari {$detail->qty_diminta} unit oleh {$approverRoleName}.";
                $detail->save();

                $approvedCount = $qty;

                $newStatus = 'Diproses';
                $permohonan->status = $newStatus;
                $permohonan->save();

                StatusHistory::create([
                    'permohonan_id' => $permohonan->id,
                    'user_id' => $approver->id,
                    'status_sebelumnya' => $oldStatus,
                    'status_baru' => $newStatus,
                    'catatan' => "Disetujui sebagian ({$qty} unit dari total {$detail->qty_diminta} unit) oleh {$approverRoleName} ({$approver->name}). " . ($catatan ? "Catatan: {$catatan}" : ""),
                ]);

                Notification::create([
                    'user_id' => $permohonan->user_id,
                    'permohonan_id' => $permohonan->id,
                    'title' => 'Persetujuan Sebagian Suvenir: ' . $permohonan->nomor_tiket,
                    'message' => "Permohonan suvenir Anda disetujui sebagian sebanyak {$qty} unit oleh {$approverRoleName}. Permohonan kini berstatus Diproses.",
                    'type' => 'warning',
                ]);
            } else {
                $detail->status_approval = 'Ditolak';
                $detail->approved_by = $approver->id;
                $detail->approved_at = Carbon::now();
                $detail->catatan_approver = $catatan ?? 'Permintaan tambahan kuota tidak disetujui.';
                $detail->save();

                $approvedCount = $detail->qty_disetujui_otomatis;

                $newStatus = ($detail->qty_disetujui_otomatis > 0) ? 'Diproses' : 'Ditolak';
                $permohonan->status = $newStatus;
                $permohonan->save();

                StatusHistory::create([
                    'permohonan_id' => $permohonan->id,
                    'user_id' => $approver->id,
                    'status_sebelumnya' => $oldStatus,
                    'status_baru' => $newStatus,
                    'catatan' => "Tambahan kuota ({$detail->qty_perlu_approval} unit) ditolak oleh {$approverRoleName} ({$approver->name}). " . ($detail->qty_disetujui_otomatis > 0 ? "Hanya kuota otomatis {$detail->qty_disetujui_otomatis} unit yang diberikan." : "Permohonan ditolak penuh.") . ($catatan ? " Alasan: {$catatan}" : ""),
                ]);

                Notification::create([
                    'user_id' => $permohonan->user_id,
                    'permohonan_id' => $permohonan->id,
                    'title' => 'Pembaruan Kuota Suvenir: ' . $permohonan->nomor_tiket,
                    'message' => "Tambahan kuota suvenir tidak disetujui oleh {$approverRoleName}." . ($detail->qty_disetujui_otomatis > 0 ? " Diproses sebanyak {$detail->qty_disetujui_otomatis} unit otomatis." : ""),
                    'type' => 'warning',
                ]);
            }

            // Catat log inventaris dan kurangi stok otomatis jika item ditemukan di inventaris
            if ($approvedCount > 0 && !empty($detail->nama_item)) {
                $inventoryItem = InventoryItem::where('kategori', 'suvenir')
                    ->where('nama_item', $detail->nama_item)
                    ->first();

                if ($inventoryItem) {
                    $deduct = min($inventoryItem->stok_tersedia, $approvedCount);
                    $inventoryItem->stok_tersedia -= $deduct;
                    $inventoryItem->save();

                    InventoryLog::create([
                        'inventory_item_id' => $inventoryItem->id,
                        'tipe' => 'Keluar',
                        'jumlah' => $deduct,
                        'catatan' => "Pengurangan otomatis alokasi suvenir untuk tiket #{$permohonan->nomor_tiket} ({$detail->nama_item})",
                        'user_id' => $approver->id,
                        'permohonan_id' => $permohonan->id,
                    ]);
                }
            }

            return $permohonan->fresh(['user', 'service', 'suvenirDetail', 'statusHistories']);
        });
    }
}

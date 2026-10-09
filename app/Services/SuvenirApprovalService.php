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
     * PIC Mengonfirmasi Kuota dan Meneruskan ke Admin untuk Persetujuan
     */
    public function confirmQuotaByPic(
        Permohonan $permohonan,
        User $picUser,
        array $items,
        ?string $catatan = null
    ): Permohonan {
        return DB::transaction(function () use ($permohonan, $picUser, $items, $catatan) {
            $detail = $permohonan->suvenirDetail;
            if (!$detail) {
                throw new Exception('Detail suvenir tidak ditemukan.');
            }

            $formData = $permohonan->form_data ?? [];
            $itemsMap = collect($items)->keyBy('nama_item');
            $totalDisetujui = 0;

            if (!empty($formData['souvenir_items']) && is_array($formData['souvenir_items'])) {
                foreach ($formData['souvenir_items'] as &$sItem) {
                    $key = $sItem['nama_item'] ?? '';
                    $approved = isset($itemsMap[$key]) ? (int)$itemsMap[$key]['qty_disetujui'] : (int)($sItem['qty'] ?? 0);
                    $sItem['qty_disetujui'] = $approved;
                    $totalDisetujui += $approved;
                }
                unset($sItem);
            } else {
                $totalDisetujui = collect($items)->sum('qty_disetujui');
            }

            $formData['pic_verification_note'] = $catatan;
            $formData['souvenir_items_verified'] = true;
            $permohonan->form_data = $formData;

            $oldStatus = $permohonan->status;
            $newStatus = 'Menunggu Approval';

            $detail->qty_disetujui_otomatis = $totalDisetujui;
            $detail->status_approval = 'Menunggu Approval Admin';
            $detail->catatan_approver = $catatan;
            $detail->save();

            $permohonan->status = $newStatus;
            $permohonan->save();

            // Catat di Status History (append-only)
            StatusHistory::create([
                'permohonan_id' => $permohonan->id,
                'user_id' => $picUser->id,
                'status_sebelumnya' => $oldStatus,
                'status_baru' => $newStatus,
                'catatan' => "Kuota diverifikasi oleh PIC Promosi ({$picUser->name}). Total kuota dialokasikan: {$totalDisetujui} unit. Diteruskan ke Admin untuk persetujuan." . ($catatan ? " Catatan PIC: {$catatan}" : ""),
            ]);

            // Kirim notifikasi ke Admin & SuperAdmin
            $admins = User::whereIn('role', ['Admin', 'SuperAdmin'])->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'permohonan_id' => $permohonan->id,
                    'title' => "Persetujuan Kuota Alat Promosi: {$permohonan->nomor_tiket}",
                    'message' => "PIC ({$picUser->name}) telah mengonfirmasi kuota ({$totalDisetujui} unit) untuk tiket {$permohonan->nomor_tiket}. Menunggu persetujuan Anda.",
                    'type' => 'warning',
                ]);
            }

            // Notifikasi ke Pemohon
            Notification::create([
                'user_id' => $permohonan->user_id,
                'permohonan_id' => $permohonan->id,
                'title' => "Verifikasi Kuota Suvenir: {$permohonan->nomor_tiket}",
                'message' => "PIC telah memverifikasi kuota suvenir Anda ({$totalDisetujui} unit dialokasikan). Menunggu persetujuan Admin.",
                'type' => 'info',
            ]);

            return $permohonan->fresh(['user', 'service', 'suvenirDetail', 'statusHistories']);
        });
    }

    /**
     * Penanganan Keputusan Approver / Admin / Super Admin (Setuju / Tolak)
     */
    public function handleApproverDecision(
        Permohonan $permohonan,
        User $approver,
        string $decision, // 'approve' atau 'reject'
        ?string $catatan = null,
        ?int $qtyDisetujui = null
    ): Permohonan {
        return DB::transaction(function () use ($permohonan, $approver, $decision, $catatan) {
            $detail = $permohonan->suvenirDetail;
            if (!$detail) {
                throw new Exception('Detail suvenir tidak ditemukan.');
            }

            $oldStatus = $permohonan->status;
            $approverRoleName = $approver->role === 'SuperAdmin' ? 'Super Admin' : 'Admin';

            if ($decision === 'approve') {
                $detail->status_approval = 'Disetujui';
                $detail->approved_by = $approver->id;
                $detail->approved_at = Carbon::now();
                $detail->catatan_approver = $catatan ?? "Permohonan dan kuota suvenir disetujui oleh {$approverRoleName} ({$approver->name}).";
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
                    'catatan' => "Permohonan dan kuota suvenir disetujui oleh {$approverRoleName} ({$approver->name}). Status kini Diproses." . ($catatan ? " Catatan Admin: {$catatan}" : ""),
                ]);

                // Notifikasi ke Pemohon
                Notification::create([
                    'user_id' => $permohonan->user_id,
                    'permohonan_id' => $permohonan->id,
                    'title' => 'Permohonan Suvenir Disetujui: ' . $permohonan->nomor_tiket,
                    'message' => "Permohonan alat promosi & suvenir Anda telah disetujui oleh Admin dan sedang Diproses.",
                    'type' => 'success',
                ]);

                // Notifikasi ke PIC Promosi
                $pics = User::where('role', 'PIC')->where('pic_service_code', 'S')->get();
                foreach ($pics as $pic) {
                    Notification::create([
                        'user_id' => $pic->id,
                        'permohonan_id' => $permohonan->id,
                        'title' => 'Permohonan Suvenir Siap Diproses: ' . $permohonan->nomor_tiket,
                        'message' => "Tiket {$permohonan->nomor_tiket} telah disetujui oleh Admin. Silakan siapkan suvenir untuk pemohon.",
                        'type' => 'success',
                    ]);
                }

                // Potong stok inventaris sesuai kuota yang disetujui
                $formData = $permohonan->form_data;
                $souvenirItems = $formData['souvenir_items'] ?? [];
                if (!empty($souvenirItems) && is_array($souvenirItems)) {
                    foreach ($souvenirItems as $sItem) {
                        $qtyDeduct = isset($sItem['qty_disetujui']) ? (int)$sItem['qty_disetujui'] : (int)($sItem['qty'] ?? 0);
                        if ($qtyDeduct > 0 && !empty($sItem['nama_item'])) {
                            $inv = InventoryItem::where('kategori', 'suvenir')->where('nama_item', $sItem['nama_item'])->first();
                            if ($inv) {
                                $actualDeduct = min($inv->stok_tersedia, $qtyDeduct);
                                $inv->stok_tersedia = max(0, $inv->stok_tersedia - $actualDeduct);
                                $inv->save();

                                InventoryLog::create([
                                    'inventory_item_id' => $inv->id,
                                    'tipe' => 'Keluar',
                                    'jumlah' => $actualDeduct,
                                    'catatan' => "Pengeluaran suvenir untuk tiket #{$permohonan->nomor_tiket}",
                                    'user_id' => $approver->id,
                                    'permohonan_id' => $permohonan->id,
                                ]);
                            }
                        }
                    }
                } elseif (!empty($detail->nama_item)) {
                    $inv = InventoryItem::where('kategori', 'suvenir')->where('nama_item', $detail->nama_item)->first();
                    $qtyDeduct = $detail->qty_disetujui_otomatis > 0 ? $detail->qty_disetujui_otomatis : $detail->qty_diminta;
                    if ($inv && $qtyDeduct > 0) {
                        $actualDeduct = min($inv->stok_tersedia, $qtyDeduct);
                        $inv->stok_tersedia = max(0, $inv->stok_tersedia - $actualDeduct);
                        $inv->save();

                        InventoryLog::create([
                            'inventory_item_id' => $inv->id,
                            'tipe' => 'Keluar',
                            'jumlah' => $actualDeduct,
                            'catatan' => "Pengeluaran suvenir untuk tiket #{$permohonan->nomor_tiket}",
                            'user_id' => $approver->id,
                            'permohonan_id' => $permohonan->id,
                        ]);
                    }
                }
            } else {
                $detail->status_approval = 'Ditolak';
                $detail->approved_by = $approver->id;
                $detail->approved_at = Carbon::now();
                $detail->catatan_approver = $catatan ?? 'Permohonan suvenir ditolak.';
                $detail->save();

                $newStatus = 'Ditolak';
                $permohonan->status = $newStatus;
                $permohonan->save();

                StatusHistory::create([
                    'permohonan_id' => $permohonan->id,
                    'user_id' => $approver->id,
                    'status_sebelumnya' => $oldStatus,
                    'status_baru' => $newStatus,
                    'catatan' => "Permohonan ditolak oleh {$approverRoleName} ({$approver->name})." . ($catatan ? " Alasan: {$catatan}" : ""),
                ]);

                Notification::create([
                    'user_id' => $permohonan->user_id,
                    'permohonan_id' => $permohonan->id,
                    'title' => 'Permohonan Suvenir Ditolak: ' . $permohonan->nomor_tiket,
                    'message' => "Permohonan suvenir Anda ditolak oleh Admin." . ($catatan ? " Alasan: {$catatan}" : ""),
                    'type' => 'danger',
                ]);
            }

            return $permohonan->fresh(['user', 'service', 'suvenirDetail', 'statusHistories']);
        });
    }
}

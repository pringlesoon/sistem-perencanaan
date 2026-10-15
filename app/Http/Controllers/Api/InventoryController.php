<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InventoryController extends Controller
{
    /**
     * Get inventory items with filtering by category & condition
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $query = InventoryItem::with(['logs' => function ($q) {
            $q->with('user:id,name')->latest()->take(10);
        }])->orderBy('nama_item', 'asc');

        if ($request->filled('kategori')) {
            $query->where('kategori', $request->kategori);
        }

        if ($request->filled('kondisi')) {
            $query->where('kondisi', $request->kondisi);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_item', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        $items = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }

    /**
     * Add new inventory item
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!in_array($user->role, ['Admin', 'SuperAdmin']) && !($user->role === 'PIC' && in_array($user->pic_service_code, ['S', 'M'])))) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $validated = $request->validate([
            'nama_item' => 'required|string|max:255',
            'stok_tersedia' => 'required|integer|min:0',
            'satuan' => 'required|string|max:50',
            'deskripsi' => 'nullable|string',
            'kategori' => 'required|string|in:suvenir,multimedia',
            'kondisi' => 'nullable|string|max:30',
        ]);

        $item = DB::transaction(function () use ($validated, $user) {
            $item = InventoryItem::create([
                'nama_item' => $validated['nama_item'],
                'stok_tersedia' => $validated['stok_tersedia'],
                'satuan' => $validated['satuan'],
                'deskripsi' => $validated['deskripsi'] ?? null,
                'kategori' => $validated['kategori'],
                'kondisi' => $validated['kondisi'] ?? 'Bagus/Oke',
            ]);

            if ($item->stok_tersedia > 0) {
                InventoryLog::create([
                    'inventory_item_id' => $item->id,
                    'tipe' => 'Masuk',
                    'jumlah' => $item->stok_tersedia,
                    'catatan' => 'Pencatatan stok awal inventaris',
                    'user_id' => $user->id,
                ]);
            }

            return $item;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Item inventaris berhasil ditambahkan.',
            'data' => $item->load('logs.user'),
        ], 201);
    }

    /**
     * Update item details or condition
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!in_array($user->role, ['Admin', 'SuperAdmin']) && !($user->role === 'PIC' && in_array($user->pic_service_code, ['S', 'M'])))) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $item = InventoryItem::findOrFail($id);

        $validated = $request->validate([
            'nama_item' => 'sometimes|required|string|max:255',
            'satuan' => 'sometimes|required|string|max:50',
            'deskripsi' => 'nullable|string',
            'kondisi' => 'sometimes|required|string|max:50',
        ]);

        $item->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Data inventaris berhasil diperbarui.',
            'data' => $item,
        ]);
    }

    /**
     * Adjust stock (+/- Masuk/Keluar) with mandatory note
     */
    public function adjust(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!in_array($user->role, ['Admin', 'SuperAdmin']) && !($user->role === 'PIC' && in_array($user->pic_service_code, ['S', 'M'])))) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $validated = $request->validate([
            'tipe' => 'required|in:Masuk,Keluar',
            'jumlah' => 'required|integer|min:1',
            'catatan' => 'required|string|min:3',
        ]);

        $item = InventoryItem::findOrFail($id);

        DB::transaction(function () use ($item, $validated, $user) {
            if ($validated['tipe'] === 'Keluar' && $item->stok_tersedia < $validated['jumlah']) {
                throw new \Exception("Stok tidak mencukupi. Stok saat ini: {$item->stok_tersedia} {$item->satuan}");
            }

            if ($validated['tipe'] === 'Masuk') {
                $item->stok_tersedia += $validated['jumlah'];
            } else {
                $item->stok_tersedia -= $validated['jumlah'];
            }
            $item->save();

            InventoryLog::create([
                'inventory_item_id' => $item->id,
                'tipe' => $validated['tipe'],
                'jumlah' => $validated['jumlah'],
                'catatan' => $validated['catatan'],
                'user_id' => $user->id,
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => "Stok berhasil disesuaikan ({$validated['tipe']} {$validated['jumlah']} {$item->satuan}).",
            'data' => $item->fresh('logs.user'),
        ]);
    }

    /**
     * Get logs for all items or a category with pagination (per 10 items) and search
     */
    public function logs(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $query = InventoryLog::with(['item', 'user:id,name', 'permohonan:id,nomor_tiket,judul_permohonan'])
            ->latest();

        if ($request->filled('kategori')) {
            $query->whereHas('item', function ($q) use ($request) {
                $q->where('kategori', $request->kategori);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('catatan', 'like', "%{$search}%")
                  ->orWhere('tipe', 'like', "%{$search}%")
                  ->orWhereHas('item', function ($iq) use ($search) {
                      $iq->where('nama_item', 'like', "%{$search}%");
                  })
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('permohonan', function ($pq) use ($search) {
                      $pq->where('nomor_tiket', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = (int) $request->input('per_page', 10);
        $logs = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $logs,
        ]);
    }

    /**
     * Export Inventory Logs to Excel (Spreadsheet XML format)
     * Columns: Waktu, Item, Tipe Mutasi, Jumlah, Keterangan / Tiket, Petugas
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $query = InventoryLog::with(['item', 'user:id,name', 'permohonan:id,nomor_tiket,judul_permohonan'])
            ->latest();

        if ($request->filled('kategori')) {
            $query->whereHas('item', function ($q) use ($request) {
                $q->where('kategori', $request->kategori);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('catatan', 'like', "%{$search}%")
                  ->orWhere('tipe', 'like', "%{$search}%")
                  ->orWhereHas('item', function ($iq) use ($search) {
                      $iq->where('nama_item', 'like', "%{$search}%");
                  })
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('permohonan', function ($pq) use ($search) {
                      $pq->where('nomor_tiket', 'like', "%{$search}%");
                  });
            });
        }

        $kategoriLabel = $request->filled('kategori') ? ucfirst($request->kategori) : 'Semua';
        $fileName = 'Riwayat_Log_Inventaris_' . $kategoriLabel . '_' . Carbon::now()->format('Ymd_His') . '.xls';

        $headers = [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query, $kategoriLabel) {
            echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
            echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
            echo ' xmlns:o="urn:schemas-microsoft-com:office:office"' . "\n";
            echo ' xmlns:x="urn:schemas-microsoft-com:office:excel"' . "\n";
            echo ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' . "\n";

            echo '<Styles>' . "\n";
            echo '  <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="11"/><Alignment ss:Vertical="Center"/></Style>' . "\n";
            echo '  <Style ss:ID="Title"><Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>' . "\n";
            echo '  <Style ss:ID="Subtitle"><Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#64748B"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>' . "\n";
            echo '  <Style ss:ID="TableHeader">' . "\n";
            echo '    <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>' . "\n";
            echo '    <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>' . "\n";
            echo '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>' . "\n";
            echo '    <Borders>' . "\n";
            echo '      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3730A3"/>' . "\n";
            echo '      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3730A3"/>' . "\n";
            echo '      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3730A3"/>' . "\n";
            echo '      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3730A3"/>' . "\n";
            echo '    </Borders>' . "\n";
            echo '  </Style>' . "\n";
            echo '  <Style ss:ID="CellCenter"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>' . "\n";
            echo '  <Style ss:ID="CellLeft"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>' . "\n";
            echo '  <Style ss:ID="CellMasuk"><Font ss:Bold="1" ss:Color="#047857"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/></Borders></Style>' . "\n";
            echo '  <Style ss:ID="CellKeluar"><Font ss:Bold="1" ss:Color="#B45309"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/></Borders></Style>' . "\n";
            echo '</Styles>' . "\n";

            echo '<Worksheet ss:Name="Riwayat Log">' . "\n";
            echo '<Table ss:DefaultRowHeight="20">' . "\n";
            echo '<Column ss:Width="130"/>' . "\n";
            echo '<Column ss:Width="180"/>' . "\n";
            echo '<Column ss:Width="100"/>' . "\n";
            echo '<Column ss:Width="90"/>' . "\n";
            echo '<Column ss:Width="260"/>' . "\n";
            echo '<Column ss:Width="140"/>' . "\n";

            // Headers
            echo '<Row ss:Height="24"><Cell ss:StyleID="Title"><Data ss:Type="String">RIWAYAT LOG KELUAR / MASUK INVENTARIS</Data></Cell></Row>' . "\n";
            echo '<Row ss:Height="18"><Cell ss:StyleID="Subtitle"><Data ss:Type="String">Kategori: ' . htmlspecialchars($kategoriLabel, ENT_QUOTES | ENT_XML1) . ' | Diekspor: ' . Carbon::now()->format('d/m/Y H:i') . '</Data></Cell></Row>' . "\n";
            echo '<Row ss:Height="10"></Row>' . "\n";

            // Columns as required by user:
            // Waktu, Item, Tipe Mutasi, Jumlah, Keterangan / Tiket, Petugas
            echo '<Row ss:Height="24">' . "\n";
            $tableHeaders = ['Waktu', 'Item', 'Tipe Mutasi', 'Jumlah', 'Keterangan / Tiket', 'Petugas'];
            foreach ($tableHeaders as $th) {
                echo '<Cell ss:StyleID="TableHeader"><Data ss:Type="String">' . htmlspecialchars($th, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
            }
            echo '</Row>' . "\n";

            $query->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $waktu = $row->created_at ? $row->created_at->format('d/m/Y H:i') : '-';
                    $itemNama = $row->item?->nama_item ?? '-';
                    $satuan = $row->item?->satuan ? (' ' . $row->item->satuan) : '';
                    $tipe = $row->tipe;
                    $jumlah = ($tipe === 'Masuk' ? "+{$row->jumlah}" : "-{$row->jumlah}") . $satuan;

                    $keterangan = $row->catatan ?? '';
                    if ($row->permohonan) {
                        $keterangan .= ($keterangan ? ' ' : '') . '[Tiket: ' . $row->permohonan->nomor_tiket . ']';
                    }
                    $petugas = $row->user?->name ?? 'Sistem';

                    $tipeStyle = $tipe === 'Masuk' ? 'CellMasuk' : 'CellKeluar';

                    echo '<Row ss:Height="20">' . "\n";
                    echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($waktu, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($itemNama, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell ss:StyleID="' . $tipeStyle . '"><Data ss:Type="String">' . htmlspecialchars($tipe, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . htmlspecialchars($jumlah, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($keterangan, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '<Cell ss:StyleID="CellLeft"><Data ss:Type="String">' . htmlspecialchars($petugas, ENT_QUOTES | ENT_XML1) . '</Data></Cell>' . "\n";
                    echo '</Row>' . "\n";
                }
            });

            echo '</Table>' . "\n";
            echo '</Worksheet>' . "\n";
            echo '</Workbook>' . "\n";
        }, 200, $headers);
    }
}


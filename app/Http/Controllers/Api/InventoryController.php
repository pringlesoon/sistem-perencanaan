<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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
     * Get logs for all items or a category
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

        $logs = $query->paginate(25);

        return response()->json([
            'status' => 'success',
            'data' => $logs,
        ]);
    }
}

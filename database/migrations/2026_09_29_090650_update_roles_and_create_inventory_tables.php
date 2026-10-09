<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('inventory_items')) {
            Schema::create('inventory_items', function (Blueprint $table) {
                $table->id();
                $table->string('nama_item');
                $table->integer('stok_tersedia')->default(0);
                $table->string('satuan', 50)->default('unit');
                $table->text('deskripsi')->nullable();
                $table->string('kategori', 50); // suvenir, multimedia
                $table->string('kondisi', 50)->default('Bagus/Oke');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('inventory_logs')) {
            Schema::create('inventory_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
                $table->string('tipe', 50); // Masuk, Keluar, Penyesuaian
                $table->integer('jumlah');
                $table->text('catatan')->nullable();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('permohonan_id')->nullable()->constrained('permohonans')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
        Schema::dropIfExists('inventory_items');
    }
};

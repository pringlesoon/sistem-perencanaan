<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permohonans', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_tiket')->unique(); // e.g. REQ-20260923-0001
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Pemohon
            $table->foreignId('service_id')->constrained()->cascadeOnDelete(); // Layanan
            $table->string('kategori', 50); // Desain, Publikasi, Suvenir, Multimedia, Liputan
            
            // Data Umum
            $table->string('judul_permohonan');
            $table->text('deskripsi_kebutuhan');
            $table->date('tanggal_dibutuhkan')->nullable();
            
            // Status Workflow PRD (Diajukan -> Diproses -> Direvisi -> Selesai / Ditolak / Menunggu Approval Sebagian)
            $table->string('status', 50)->default('Diajukan');
            
            $table->text('catatan_revisi')->nullable();
            $table->integer('lead_time_minutes')->nullable();
            $table->timestamp('selesai_at')->nullable();
            $table->timestamps();
            
            $table->index(['service_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permohonans');
    }
};
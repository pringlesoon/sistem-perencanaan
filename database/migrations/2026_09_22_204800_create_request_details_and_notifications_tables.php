<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Detail khusus Multimedia [M]
        Schema::create('request_multimedia_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permohonan_id')->constrained('permohonans')->cascadeOnDelete();
            $table->date('tanggal_pelaksanaan');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->integer('durasi_menit');
            $table->string('lokasi_alat')->nullable();
            $table->timestamps();

            $table->index(['tanggal_pelaksanaan', 'jam_mulai', 'jam_selesai'], 'rmd_schedule_index');
        });

        // 2. Detail khusus Suvenir [S]
        Schema::create('request_suvenir_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permohonan_id')->constrained('permohonans')->cascadeOnDelete();
            $table->string('nama_item');
            $table->integer('qty_diminta');
            $table->integer('qty_disetujui_otomatis')->default(0);
            $table->integer('qty_perlu_approval')->default(0);
            $table->enum('status_approval', ['Menunggu Approval', 'Disetujui', 'Ditolak'])->default('Menunggu Approval');
            $table->text('catatan_approver')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        // 3. Lampiran Berkas Permohonan
        Schema::create('request_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permohonan_id')->constrained('permohonans')->cascadeOnDelete();
            $table->string('file_name');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size'); // byte
            $table->string('mime_type', 100);
            $table->timestamps();
        });

        // 4. In-App Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('permohonan_id')->nullable()->constrained('permohonans')->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info'); // info, success, warning, danger
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('request_attachments');
        Schema::dropIfExists('request_suvenir_details');
        Schema::dropIfExists('request_multimedia_details');
    }
};

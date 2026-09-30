<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permohonan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->comment('ID User/Admin/Approver yang mengubah status');
            $table->string('status_sebelumnya')->nullable();
            $table->string('status_baru');
            $table->text('catatan')->nullable(); // Alasan atau keterangan
            $table->timestamps(); // created_at digunakan sebagai rekaman waktu
        });
    }

    public function down()
    {
        Schema::dropIfExists('status_histories');
    }
};
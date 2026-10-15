<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('status_histories', function (Blueprint $table) {
            $table->string('file_name')->nullable()->after('catatan');
            $table->string('file_path')->nullable()->after('file_name');
            $table->unsignedBigInteger('file_size')->nullable()->after('file_path');
            $table->string('mime_type', 100)->nullable()->after('file_size');
        });
    }

    public function down(): void
    {
        Schema::table('status_histories', function (Blueprint $table) {
            $table->dropColumn(['file_name', 'file_path', 'file_size', 'mime_type']);
        });
    }
};

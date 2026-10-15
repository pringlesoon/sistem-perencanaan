<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonans', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false)->after('selesai_at');
            $table->timestamp('archived_at')->nullable()->after('is_archived');
            $table->index(['is_archived', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('permohonans', function (Blueprint $table) {
            $table->dropIndex(['is_archived', 'status']);
            $table->dropColumn(['is_archived', 'archived_at']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change status_approval from ENUM to VARCHAR(50) to support 'Disetujui Sebagian' and avoid 1265 Data truncated warnings
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE request_suvenir_details MODIFY COLUMN status_approval VARCHAR(50) NOT NULL DEFAULT 'Menunggu Approval'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE request_suvenir_details MODIFY COLUMN status_approval ENUM('Menunggu Approval', 'Disetujui', 'Ditolak') NOT NULL DEFAULT 'Menunggu Approval'");
        }
    }
};

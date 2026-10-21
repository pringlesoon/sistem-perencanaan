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
        // Konversi pengguna dengan role Admin sebelumnya menjadi Tata Usaha
        DB::table('users')->where('role', 'Admin')->update(['role' => 'Tata Usaha']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('User', 'Tata Usaha', 'SuperAdmin', 'PIC') DEFAULT 'User'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')->where('role', 'Tata Usaha')->update(['role' => 'Admin']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('User', 'Admin', 'SuperAdmin', 'PIC') DEFAULT 'User'");
        }
    }
};

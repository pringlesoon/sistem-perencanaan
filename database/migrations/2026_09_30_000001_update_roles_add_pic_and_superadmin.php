<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // 1. Add pic_service_code column to users table for PIC service assignment
        Schema::table('users', function (Blueprint $table) {
            $table->string('pic_service_code', 10)->nullable()->after('role');
        });

        // 2. Update the role enum to include SuperAdmin and PIC roles
        // We'll use a workaround since MySQL enum can't easily be altered
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('User', 'Admin', 'SuperAdmin', 'PIC', 'Approver', 'Verificator') DEFAULT 'User'");
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('pic_service_code');
        });
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('User', 'Admin', 'Approver', 'Verificator') DEFAULT 'User'");
    }
};

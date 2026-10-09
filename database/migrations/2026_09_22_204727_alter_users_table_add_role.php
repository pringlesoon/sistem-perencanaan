<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->nullable()->after('name');
            $table->string('unit_kerja')->nullable()->after('email');
            $table->string('role', 50)->default('User')->after('unit_kerja');
            
            // Kolom tambahan untuk integrasi LdapRecord
            $table->string('guid')->unique()->nullable();
            $table->string('domain')->nullable();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'unit_kerja', 'role', 'guid', 'domain']);
        });
    }
};
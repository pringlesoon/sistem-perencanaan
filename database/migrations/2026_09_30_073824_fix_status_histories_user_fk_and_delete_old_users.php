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
        // 1. Drop old foreign key and set null on delete on status_histories
        Schema::table('status_histories', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('status_histories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        // 2. Change permohonans.status to varchar(50) so it supports any service workflow statuses
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE `permohonans` MODIFY `status` VARCHAR(50) NOT NULL DEFAULT 'Diajukan'");

        // 3. Delete old users: Dr. Budi Santoso (budi) and Dina Mariana (dina)
        \App\Models\User::whereIn('username', ['budi', 'dina'])->delete();
    }

    public function down(): void
    {
        Schema::table('status_histories', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users');
        });
    }
};

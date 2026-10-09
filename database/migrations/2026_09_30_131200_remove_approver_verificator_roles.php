<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Convert any existing Approver or Verificator users to 'User' role
        DB::table('users')->whereIn('role', ['Approver', 'Verificator'])->update(['role' => 'User']);

        // Update the role enum to remove Approver and Verificator
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('User', 'Admin', 'SuperAdmin', 'PIC') DEFAULT 'User'");
        }
    }

    public function down()
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('User', 'Admin', 'SuperAdmin', 'PIC', 'Approver', 'Verificator') DEFAULT 'User'");
        }
    }
};

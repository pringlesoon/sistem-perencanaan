<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('code', 5)->unique(); // D, P, S, M, L
            $table->string('name');
            $table->text('description');
            $table->longText('rules_text')->nullable(); // Rich-text/Markdown Syarat & Ketentuan
            $table->string('icon')->default('file-text');
            $table->string('color')->default('blue');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('service_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->string('config_key');
            $table->string('config_value');
            $table->string('description')->nullable();
            $table->timestamps();

            $table->unique(['service_id', 'config_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_configs');
        Schema::dropIfExists('services');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('system_name')->default('نظام إدارة السائقين والمركبات');
            $table->string('logo')->nullable();
            $table->string('manager_signature')->nullable();
            $table->string('manager_signature_color', 7)->default('#172554');
            $table->unsignedTinyInteger('manager_signature_width')->default(4);
            $table->string('badge_color', 7)->default('#4338ca');
            $table->text('contact_info')->nullable();
            $table->unsignedTinyInteger('badge_validity_years')->default(1);
            $table->unsignedSmallInteger('expiring_soon_days')->default(30);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};

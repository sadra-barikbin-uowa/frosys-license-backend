<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();
            $table->string('badge_number')->unique();

            $table->foreignId('driver_id')
                ->constrained('drivers')
                ->cascadeOnDelete();

            $table->foreignId('vehicle_id')
                ->nullable()
                ->constrained('vehicles')
                ->nullOnDelete();

            // Snapshot fields used to display the badge
            $table->string('driver_name');
            $table->string('job_title')->nullable();
            $table->string('person_type')->nullable();
            $table->string('driver_photo')->nullable();
            $table->string('national_id')->nullable();
            $table->string('license_number')->nullable();

            $table->string('vehicle_type')->nullable();
            $table->string('vehicle_number')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_color')->nullable();

            $table->date('issue_date');
            $table->date('expiry_date');
            $table->string('status')->default('Active');

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badges');
    }
};

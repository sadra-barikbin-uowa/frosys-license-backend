<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('badge_requests', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();
            $table->string('full_name');
            $table->string('job_title')->nullable();
            $table->string('person_type');
            $table->date('birth_date')->nullable();
            $table->string('phone', 50);
            $table->text('address')->nullable();
            $table->string('national_id', 100)->nullable()->index();
            $table->string('photo');
            $table->string('identity_document');
            $table->string('vehicle_type');
            $table->string('vehicle_number', 100);
            $table->string('model')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('color')->nullable();
            $table->string('vehicle_photo')->nullable();
            $table->string('status')->default('pending')->index();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('badge_id')->nullable()->constrained('badges')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badge_requests');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();

            $table->string('full_name');
            $table->string('job_title')->nullable();
            $table->string('person_type');
            $table->string('national_id')->nullable()->index();
            $table->date('birth_date')->nullable();
            $table->string('phone');
            $table->text('address')->nullable();

            $table->string('license_number')->unique();
            $table->date('license_issue')->nullable();
            $table->date('license_expiry');
            $table->string('photo')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
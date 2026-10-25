<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('identity_document_type')->default('administrative_order');
            $table->string('identity_document_back')->nullable();
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('registration_front')->nullable();
            $table->string('registration_back')->nullable();
        });

        Schema::table('badge_requests', function (Blueprint $table) {
            $table->string('identity_document_type')->default('administrative_order');
            $table->string('identity_document_back')->nullable();
            $table->string('vehicle_registration_front')->nullable();
            $table->string('vehicle_registration_back')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('badge_requests', function (Blueprint $table) {
            $table->dropColumn([
                'identity_document_type',
                'identity_document_back',
                'vehicle_registration_front',
                'vehicle_registration_back',
            ]);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['registration_front', 'registration_back']);
        });

        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['identity_document_type', 'identity_document_back']);
        });
    }
};

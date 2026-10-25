<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('identity_document')->nullable();
            $table->string('license_number')->nullable()->change();
            $table->date('license_issue')->nullable()->change();
            $table->date('license_expiry')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn('identity_document');
            $table->string('license_number')->nullable(false)->change();
            $table->date('license_expiry')->nullable(false)->change();
        });
    }
};

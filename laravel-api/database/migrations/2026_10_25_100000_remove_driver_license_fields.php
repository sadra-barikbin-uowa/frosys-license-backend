<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driverColumns = array_values(array_filter(
            ['license_number', 'license_issue', 'license_expiry'],
            fn (string $column) => Schema::hasColumn('drivers', $column),
        ));

        if ($driverColumns) {
            Schema::table('drivers', function (Blueprint $table) use ($driverColumns) {
                $table->dropColumn($driverColumns);
            });
        }

        if (Schema::hasColumn('badges', 'license_number')) {
            Schema::table('badges', function (Blueprint $table) {
                $table->dropColumn('license_number');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('drivers', 'license_number')) {
            Schema::table('drivers', function (Blueprint $table) {
                $table->string('license_number')->nullable()->unique();
                $table->date('license_issue')->nullable();
                $table->date('license_expiry')->nullable();
            });
        }

        if (! Schema::hasColumn('badges', 'license_number')) {
            Schema::table('badges', function (Blueprint $table) {
                $table->string('license_number')->nullable();
            });
        }
    }
};

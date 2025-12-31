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
        Schema::table('banshirou_reservations', function (Blueprint $table) {
            $table->time('checkin_time')->nullable()->after('checkin_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('banshirou_reservations', function (Blueprint $table) {
            $table->dropColumn('checkin_time');
        });
    }
};

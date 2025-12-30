<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invites', function (Blueprint $table) {
            $table->string('invitee_name')->after('id')->default('');
        });

        // Set default invitee_name for existing records based on email
        DB::table('invites')->whereNull('invitee_name')->orWhere('invitee_name', '')->update([
            'invitee_name' => DB::raw("SUBSTRING_INDEX(email, '@', 1)"),
        ]);

        // Remove default and make email nullable
        Schema::table('invites', function (Blueprint $table) {
            $table->string('invitee_name')->default(null)->change();
            $table->string('email')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invites', function (Blueprint $table) {
            $table->dropColumn('invitee_name');
            $table->string('email')->nullable(false)->change();
        });
    }
};

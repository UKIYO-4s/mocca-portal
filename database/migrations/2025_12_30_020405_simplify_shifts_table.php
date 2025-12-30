<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * シフトを「出勤/休日」のみのシンプルな形式に変更
     */
    public function up(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            // 1. status カラム追加（既存データは 'working' に）
            $table->enum('status', ['working', 'off'])->default('working')->after('date');
        });

        Schema::table('shifts', function (Blueprint $table) {
            // 2. 既存ユニーク制約を削除（インデックス名を直接指定）
            $table->dropUnique('shifts_user_date_start_unique');
        });

        Schema::table('shifts', function (Blueprint $table) {
            // 3. 新しいユニーク制約を追加（1ユーザー1日1レコード）
            $table->unique(['user_id', 'date']);
        });

        Schema::table('shifts', function (Blueprint $table) {
            // 4. 不要カラムを削除
            $table->dropForeign(['location_id']);
            $table->dropColumn(['start_time', 'end_time', 'location_id', 'notes']);
        });

        Schema::table('shifts', function (Blueprint $table) {
            // 5. date, location_id の複合インデックスを削除
            $table->dropIndex(['date', 'location_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            // 1. 削除したカラムを復元
            $table->time('start_time')->after('date');
            $table->time('end_time')->after('start_time');
            $table->foreignId('location_id')->nullable()->after('end_time')->constrained()->nullOnDelete();
            $table->text('notes')->nullable()->after('location_id');
        });

        Schema::table('shifts', function (Blueprint $table) {
            // 2. date, location_id の複合インデックスを復元
            $table->index(['date', 'location_id']);
        });

        Schema::table('shifts', function (Blueprint $table) {
            // 3. 新しいユニーク制約を削除
            $table->dropUnique(['user_id', 'date']);
        });

        Schema::table('shifts', function (Blueprint $table) {
            // 4. 元のユニーク制約を復元（同じインデックス名で）
            $table->unique(['user_id', 'date', 'start_time'], 'shifts_user_date_start_unique');
        });

        Schema::table('shifts', function (Blueprint $table) {
            // 5. status カラムを削除
            $table->dropColumn('status');
        });
    }
};

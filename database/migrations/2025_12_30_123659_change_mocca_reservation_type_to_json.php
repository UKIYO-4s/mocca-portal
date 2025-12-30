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
        // 既存データを配列形式に変換しながらカラムタイプを変更
        // MySQLではenumからjsonへの直接変更ができないため、一時カラムを使用
        Schema::table('mocca_reservations', function (Blueprint $table) {
            $table->json('reservation_types')->nullable()->after('reservation_type');
        });

        // 既存データを移行（単一値を配列に変換）
        DB::statement("UPDATE mocca_reservations SET reservation_types = JSON_ARRAY(reservation_type)");

        // 古いカラムを削除し、新しいカラムをリネーム
        Schema::table('mocca_reservations', function (Blueprint $table) {
            $table->dropColumn('reservation_type');
        });

        Schema::table('mocca_reservations', function (Blueprint $table) {
            $table->renameColumn('reservation_types', 'reservation_type');
        });

        // インデックスを再作成
        Schema::table('mocca_reservations', function (Blueprint $table) {
            $table->index(['reservation_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mocca_reservations', function (Blueprint $table) {
            $table->dropIndex(['reservation_date']);
        });

        Schema::table('mocca_reservations', function (Blueprint $table) {
            $table->string('reservation_type_old')->nullable()->after('id');
        });

        // JSON配列の最初の値を取得
        DB::statement("UPDATE mocca_reservations SET reservation_type_old = JSON_UNQUOTE(JSON_EXTRACT(reservation_type, '$[0]'))");

        Schema::table('mocca_reservations', function (Blueprint $table) {
            $table->dropColumn('reservation_type');
        });

        Schema::table('mocca_reservations', function (Blueprint $table) {
            $table->renameColumn('reservation_type_old', 'reservation_type');
        });

        // enum制約を再追加（MySQL固有）
        DB::statement("ALTER TABLE mocca_reservations MODIFY reservation_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL");

        Schema::table('mocca_reservations', function (Blueprint $table) {
            $table->index(['reservation_date', 'reservation_type']);
        });
    }
};

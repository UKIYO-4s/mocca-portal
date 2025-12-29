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
        Schema::create('mocca_reservations', function (Blueprint $table) {
            $table->id();
            $table->enum('reservation_type', ['breakfast', 'lunch', 'dinner']);
            $table->date('reservation_date');
            $table->string('name');
            $table->unsignedInteger('guest_count');
            $table->time('arrival_time')->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('advance_menu')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('banshirou_reservation_id')
                  ->nullable()
                  ->constrained('banshirou_reservations')
                  ->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['confirmed', 'cancelled'])->default('confirmed');
            $table->timestamps();

            $table->index(['reservation_date', 'reservation_type']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mocca_reservations');
    }
};

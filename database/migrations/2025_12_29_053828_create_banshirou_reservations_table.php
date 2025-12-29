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
        Schema::create('banshirou_reservations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_kana');
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->text('address');
            $table->date('checkin_date');
            $table->date('checkout_date');
            $table->unsignedInteger('guest_count_adults')->default(1);
            $table->unsignedInteger('guest_count_children')->default(0);
            $table->enum('meal_option', ['with_meals', 'seat_only', 'no_meals']);
            $table->boolean('pickup_required')->default(false);
            $table->json('options')->nullable();
            $table->enum('payment_method', ['cash', 'credit', 'bank_transfer']);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['confirmed', 'cancelled'])->default('confirmed');
            $table->timestamps();

            $table->index('checkin_date');
            $table->index('checkout_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banshirou_reservations');
    }
};

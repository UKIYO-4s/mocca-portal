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
        Schema::create('guest_pages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('reservation_id')->nullable();
            $table->enum('reservation_type', ['banshirou', 'mocca'])->nullable();
            $table->string('guest_name');
            $table->string('room_number')->nullable();
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->string('qr_code_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('uuid');
            $table->index('is_active');
            $table->index('expires_at');
            $table->index(['reservation_id', 'reservation_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guest_pages');
    }
};

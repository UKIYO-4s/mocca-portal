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
        Schema::create('reservation_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('banshirou_reservations')->onDelete('cascade');
            $table->enum('assignment_type', ['cleaning', 'setup']);
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('reminder_sent_day_before')->default(false);
            $table->boolean('reminder_sent_day_of')->default(false);
            $table->timestamps();

            $table->unique(['reservation_id', 'assignment_type']);
            $table->index(['user_id', 'assignment_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservation_assignments');
    }
};

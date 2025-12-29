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
        Schema::create('tip_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guest_page_id')->constrained('guest_pages')->onDelete('cascade');
            $table->foreignId('staff_id')->constrained('users')->onDelete('cascade');
            $table->string('transaction_hash', 66)->unique();
            $table->string('network')->default('polygon');
            $table->unsignedInteger('tip_count')->default(1);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('tipped_at')->useCurrent();

            $table->index('staff_id');
            $table->index('tipped_at');
            $table->index(['guest_page_id', 'staff_id']);
            $table->index(['ip_address', 'staff_id', 'tipped_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tip_transactions');
    }
};

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
        Schema::create('google_review_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guest_page_id')->constrained('guest_pages')->onDelete('cascade');
            $table->timestamp('clicked_at')->useCurrent();
            $table->string('ip_address', 45)->nullable();
            $table->boolean('review_submitted')->default(false);
            $table->timestamp('submitted_at')->nullable();

            $table->index('guest_page_id');
            $table->index('clicked_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_review_requests');
    }
};

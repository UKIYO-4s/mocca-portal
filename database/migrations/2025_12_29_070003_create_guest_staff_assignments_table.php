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
        Schema::create('guest_staff_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guest_page_id')->constrained('guest_pages')->onDelete('cascade');
            $table->foreignId('staff_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['cooking', 'cleaning', 'front']);
            $table->timestamp('assigned_at')->useCurrent();

            $table->unique(['guest_page_id', 'staff_id']);
            $table->index('staff_id');
            $table->index('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guest_staff_assignments');
    }
};

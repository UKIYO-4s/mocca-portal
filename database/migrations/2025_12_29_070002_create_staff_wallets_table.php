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
        Schema::create('staff_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('wallet_address', 42)->unique();
            $table->boolean('is_verified')->default(false);
            $table->string('verification_tx_hash', 66)->nullable();
            $table->timestamp('connected_at')->nullable();
            $table->timestamps();

            $table->index('wallet_address');
            $table->index('is_verified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_wallets');
    }
};

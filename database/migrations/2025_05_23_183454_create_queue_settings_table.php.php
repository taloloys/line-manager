<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('queue_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('max_queue_size')->default(50);
            $table->boolean('notification_sound')->default(true);
            $table->integer('auto_refresh_interval')->default(5);
            $table->boolean('privacy_mode')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queue_settings');
    }
};

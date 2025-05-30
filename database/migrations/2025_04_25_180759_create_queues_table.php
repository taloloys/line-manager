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
        Schema::create('queues', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('student_id')->nullable(); // Added for external data
            $table->string('purpose')->nullable();    // Added for external data
            $table->string('email')->nullable();      // Added for external data
            $table->integer('queue_number')->unique();
            $table->enum('status', ['waiting', 'served', 'skipped', 'cancelled'])->default('waiting');
            $table->timestamp('served_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queues');
    }
};

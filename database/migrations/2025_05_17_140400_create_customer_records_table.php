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
        Schema::create('customer_records', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('student_id')->nullable();
            $table->string('purpose')->nullable();
            $table->string('email')->nullable();
            $table->integer('queue_number');
            $table->enum('status', ['served', 'skipped'])->default('served');
            $table->timestamp('served_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_records');
    }
};

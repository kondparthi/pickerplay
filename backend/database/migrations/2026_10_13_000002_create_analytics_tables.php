<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per page per day: views, unique visitors and spins/plays
        Schema::create('analytics_daily', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('path', 191);          // e.g. /, /team-picker, /yes-no-wheel, /blog/x, /abc-123
            $table->string('type', 20);           // home | game | team | tool | blog | blog_list | share | gallery | page | embed | other
            $table->string('label', 200)->nullable();
            $table->unsignedInteger('views')->default(0);
            $table->unsignedInteger('visitors')->default(0);
            $table->unsignedInteger('spins')->default(0);
            $table->unique(['date', 'path']);
            $table->index(['type', 'date']);
        });

        // Anonymous visitor fingerprints (hashed, salted daily) used only to count unique visitors.
        // Pruned after 35 days by the scheduler.
        Schema::create('analytics_visitors', function (Blueprint $table) {
            $table->date('date');
            $table->string('path', 191);
            $table->char('hash', 40);
            $table->primary(['date', 'path', 'hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_visitors');
        Schema::dropIfExists('analytics_daily');
    }
};

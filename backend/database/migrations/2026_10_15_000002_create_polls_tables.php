<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Polling Wheel: a question with options; people vote from a shared link, the creator sees live results. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('polls', function (Blueprint $table) {
            $table->id();
            $table->string('code', 12)->unique();          // public link  /poll/{code}
            $table->string('admin_token', 64);             // sha256 of the creator's secret results key
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('question', 300);
            $table->json('options');                       // [{id, text, color}]
            $table->json('settings')->nullable();          // {show_results, ask_name, allow_change}
            $table->boolean('is_closed')->default(false);
            $table->unsignedInteger('votes_count')->default(0);
            $table->unsignedInteger('views')->default(0);
            $table->string('creator_ip', 64)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('option_id');
            $table->string('voter_hash', 64);              // sha256(poll + device id) – one vote per device
            $table->string('name', 80)->nullable();
            $table->timestamps();
            $table->unique(['poll_id', 'voter_hash']);
            $table->index(['poll_id', 'option_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_votes');
        Schema::dropIfExists('polls');
    }
};

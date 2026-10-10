<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wheels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // saved  = stored in a user's account (Save / Open)
            // shared = public snapshot reachable at /{share_code}
            $table->enum('kind', ['saved', 'shared'])->default('saved')->index();
            $table->string('share_code', 16)->nullable()->unique();
            $table->string('title', 150)->nullable();
            $table->string('description', 1000)->nullable();
            // private   = only the owner (saved wheels)
            // link_spin = anyone with link can spin, entries hidden & not copyable
            // link_copy = anyone with link can spin and copy
            // public    = link_copy + listed in the public gallery
            $table->enum('visibility', ['private', 'link_spin', 'link_copy', 'public'])->default('private')->index();
            $table->boolean('show_title')->default(true);
            $table->boolean('is_featured')->default(false)->index();
            $table->json('config');                 // full wheel snapshot: entries + settings
            $table->text('entries_text')->nullable(); // flattened entries for gallery search
            $table->unsignedInteger('entries_count')->default(0);
            $table->unsignedBigInteger('views')->default(0);
            $table->timestamp('last_viewed_at')->nullable()->index();
            $table->string('creator_ip', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wheels');
    }
};

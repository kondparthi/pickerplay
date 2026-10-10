<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // White-label key/value settings (branding, ads, SEO, defaults)
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->longText('value')->nullable();
            $table->boolean('is_public')->default(true);
            $table->timestamps();
        });

        // CMS pages: terms, privacy, FAQ, API docs, streaming, blog, changelog...
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('title', 200);
            $table->string('meta_description', 300)->nullable();
            $table->longText('content')->nullable();
            $table->string('icon', 40)->nullable();
            $table->boolean('show_in_footer')->default(true);
            $table->boolean('is_published')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // SEO landing pages for preset pickers (/yes-no-wheel, /number-picker ...)
        Schema::create('tool_presets', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('name', 120);
            $table->string('heading', 200)->nullable();
            $table->string('meta_title', 200)->nullable();
            $table->string('meta_description', 300)->nullable();
            $table->json('config');
            $table->longText('content')->nullable();
            $table->string('emoji', 16)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('show_in_menu')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 120)->nullable();
            $table->string('email', 190)->nullable();
            $table->string('type', 30)->default('feedback'); // feedback | bug | idea | ad_report | wheel_report
            $table->text('message');
            $table->string('page_url', 500)->nullable();
            $table->string('ip', 45)->nullable();
            $table->boolean('is_read')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('prefix', 12)->index();
            $table->string('key_hash', 64)->unique();
            $table->timestamp('last_used_at')->nullable();
            $table->unsignedBigInteger('requests')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Global counters shown in "Activity" card
        Schema::create('stats', function (Blueprint $table) {
            $table->string('key', 60)->primary();
            $table->unsignedBigInteger('value')->default(0);
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 80);
            $table->json('metadata')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('stats');
        Schema::dropIfExists('api_keys');
        Schema::dropIfExists('feedback');
        Schema::dropIfExists('tool_presets');
        Schema::dropIfExists('pages');
        Schema::dropIfExists('settings');
    }
};

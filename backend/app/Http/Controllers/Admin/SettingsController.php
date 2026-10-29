<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $keys = array_keys(SiteSettings::DEFAULTS);
        $all = SiteSettings::all();

        return response()->json([
            'data' => collect($keys)->mapWithKeys(fn ($k) => [$k => $all[$k] ?? ''])->all(),
            'private_keys' => collect($keys)->reject(fn ($k) => SiteSettings::isPublic($k))->values(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => ['required', 'array'],
            'settings.primary_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'settings.secondary_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'settings.accent_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'settings.page_bg_from' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'settings.page_bg_to' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'settings.contact_email' => ['nullable', 'email'],
            'settings.site_name' => ['nullable', 'string', 'max:80'],
        ]);
        $settings = collect($request->input('settings'))
            ->only(array_keys(SiteSettings::DEFAULTS))
            ->map(fn ($v) => is_array($v) ? implode(',', $v) : $v)
            ->all();
        SiteSettings::set($settings);
        AuditLog::record('settings.updated', ['keys' => array_keys($settings)]);

        return response()->json(['ok' => true, 'data' => SiteSettings::all()]);
    }

    /** POST /api/admin/settings/asset  (multipart: file, key=logo_url|logo_dark_url|favicon_url|og_image) */
    /** Sends a sample feedback email so the admin can check the SMTP settings in .env. */
    public function testEmail(Request $request): JsonResponse
    {
        $to = $request->input('to') ?: SiteSettings::get('feedback_notify_email');
        if (! $to || ! filter_var(trim(explode(',', $to)[0]), FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Enter the email address first.'], 422);
        }
        $fb = new \App\Models\Feedback([
            'name' => 'PickerPlay test',
            'email' => null,
            'type' => 'feedback',
            'message' => "This is a test email from the admin panel.\nIf you can read this, feedback form emails are working.",
            'page_url' => rtrim(config('app.url'), '/').'/',
        ]);
        $fb->created_at = now();
        try {
            \Illuminate\Support\Facades\Mail::to(array_map('trim', explode(',', $to)))->send(new \App\Mail\FeedbackReceived($fb));
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Sending failed: '.$e->getMessage()], 422);
        }

        return response()->json(['message' => "Test email sent to {$to}. Check the inbox (and spam folder)."]);
    }

    public function uploadAsset(Request $request): JsonResponse
    {
        $request->validate([
            'key' => ['required', 'in:logo_url,logo_dark_url,favicon_url,og_image'],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,webp,svg,ico', 'max:4096'],
        ]);
        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());

        if (in_array($ext, ['svg', 'ico'], true)) {
            // keep vector logos / icons untouched (admin-only upload)
            $content = file_get_contents($file->getRealPath());
            if ($ext === 'svg' && preg_match('/<script|on\w+\s*=|javascript:/i', $content)) {
                return response()->json(['message' => 'SVG contains scripts and was rejected.'], 422);
            }
            $path = $file->storeAs('brand', \Illuminate\Support\Str::random(16).'.'.$ext, 'uploads');
            $url = '/uploads/'.$path;
        } elseif ($ext === 'png' || $request->key === 'favicon_url') {
            // keep PNG transparency exactly as designed
            $url = '/uploads/'.$file->storeAs('brand', \Illuminate\Support\Str::random(16).'.'.$ext, 'uploads');
        } else {
            $url = UploadController::storeImage($file, 'brand');
        }

        SiteSettings::set([$request->key => $url]);
        AuditLog::record('settings.asset_uploaded', ['key' => $request->key, 'url' => $url]);

        return response()->json(['url' => $url]);
    }
}

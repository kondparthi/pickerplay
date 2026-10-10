<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Services\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class FeedbackController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
            'type' => ['nullable', 'in:feedback,bug,idea,ad_report,wheel_report'],
            'message' => ['required', 'string', 'min:3', 'max:5000'],
            'page_url' => ['nullable', 'string', 'max:500'],
            'website' => ['nullable', 'max:0'], // honeypot
        ]);
        $fb = Feedback::create([
            'user_id' => $request->user('sanctum')?->id,
            'name' => isset($data['name']) ? strip_tags($data['name']) : null,
            'email' => $data['email'] ?? null,
            'type' => $data['type'] ?? 'feedback',
            'message' => strip_tags($data['message']),
            'page_url' => $data['page_url'] ?? null,
            'ip' => $request->ip(),
        ]);

        if ($to = SiteSettings::get('feedback_notify_email')) {
            try {
                Mail::raw("New {$fb->type} from ".($fb->name ?: 'anonymous')." <{$fb->email}>\n\n{$fb->message}\n\nPage: {$fb->page_url}",
                    fn ($m) => $m->to($to)->subject('['.SiteSettings::get('site_name').'] New '.$fb->type));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json(['message' => 'Thank you! Your message has been received.'], 201);
    }
}

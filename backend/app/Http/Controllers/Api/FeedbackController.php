<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\FeedbackReceived;
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

        // ad reports go to the "Report bad ad" email (if set), everything else to the feedback email
        $to = $fb->type === 'ad_report'
            ? (SiteSettings::get('ad_report_email') ?: SiteSettings::get('feedback_notify_email'))
            : SiteSettings::get('feedback_notify_email');
        if ($to) {
            try {
                Mail::to(array_map('trim', explode(',', $to)))->send(new FeedbackReceived($fb));
            } catch (\Throwable $e) {
                report($e); // the message is still saved in Admin -> Feedback
            }
        }

        return response()->json(['message' => 'Thank you! Your message has been received.'], 201);
    }
}

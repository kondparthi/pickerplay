<?php

namespace App\Mail;

use App\Models\Feedback;
use App\Services\SiteSettings;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Email sent to the site owner for every feedback / bug / idea / ad report. */
class FeedbackReceived extends Mailable
{
    public const LABELS = [
        'feedback' => 'Feedback',
        'bug' => 'Bug report',
        'idea' => 'Feature idea',
        'ad_report' => 'Bad ad report',
        'wheel_report' => 'Wheel report',
    ];

    public function __construct(public Feedback $feedback) {}

    public function envelope(): Envelope
    {
        $site = SiteSettings::get('site_name', 'PickerPlay');
        $label = self::LABELS[$this->feedback->type] ?? 'Feedback';
        $from = $this->feedback->name ?: ($this->feedback->email ?: 'a visitor');

        return new Envelope(
            subject: "[{$site}] {$label} from {$from}",
            replyTo: $this->feedback->email ? [new Address($this->feedback->email, $this->feedback->name ?: '')] : [],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.feedback', with: [
            'fb' => $this->feedback,
            'label' => self::LABELS[$this->feedback->type] ?? 'Feedback',
            'site' => SiteSettings::get('site_name', 'PickerPlay'),
            'adminUrl' => rtrim(config('app.url'), '/').'/admin/feedback',
        ]);
    }
}

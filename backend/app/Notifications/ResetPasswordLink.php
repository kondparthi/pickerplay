<?php

namespace App\Notifications;

use App\Services\SiteSettings;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordLink extends Notification
{
    public function __construct(public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $site = SiteSettings::get('site_name', config('app.name'));
        $url = rtrim(config('app.url'), '/').'/reset-password?token='.urlencode($this->token)
            .'&email='.urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject("Reset your {$site} password")
            ->greeting('Hello!')
            ->line("We received a request to reset the password for your {$site} account.")
            ->action('Reset password', $url)
            ->line('This link expires in 60 minutes. If you did not request it, you can ignore this email.');
    }
}

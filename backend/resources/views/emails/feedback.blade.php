<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#f4f5fb;font-family:Arial,Helvetica,sans-serif;color:#1c1d2e">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7e9f3">
    <tr>
      <td style="background:#5546c9;color:#ffffff;padding:18px 24px;font-size:18px;font-weight:bold">
        {{ $site }} · New {{ strtolower($label) }}
      </td>
    </tr>
    <tr>
      <td style="padding:22px 24px">
        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6;margin-bottom:16px">
          <tr><td style="color:#6b7090;padding-right:14px">Type</td><td><strong>{{ $label }}</strong></td></tr>
          <tr><td style="color:#6b7090;padding-right:14px">Name</td><td>{{ $fb->name ?: '—' }}</td></tr>
          <tr><td style="color:#6b7090;padding-right:14px">Email</td><td>@if($fb->email)<a href="mailto:{{ $fb->email }}" style="color:#5546c9">{{ $fb->email }}</a>@else — @endif</td></tr>
          <tr><td style="color:#6b7090;padding-right:14px">Page</td><td>@if($fb->page_url)<a href="{{ $fb->page_url }}" style="color:#5546c9">{{ $fb->page_url }}</a>@else — @endif</td></tr>
          <tr><td style="color:#6b7090;padding-right:14px">Received</td><td>{{ $fb->created_at?->timezone(config('app.timezone'))->format('d M Y, h:i A') }}</td></tr>
        </table>
        <div style="background:#f4f5fb;border-radius:10px;padding:14px 16px;font-size:15px;line-height:1.6;white-space:pre-wrap">{{ $fb->message }}</div>
        <p style="margin:20px 0 0">
          <a href="{{ $adminUrl }}" style="display:inline-block;background:#5546c9;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold">Open in admin</a>
        </p>
        @if($fb->email)
          <p style="margin:14px 0 0;font-size:13px;color:#6b7090">Tip: just press <strong>Reply</strong> – your answer goes straight to {{ $fb->email }}.</p>
        @endif
      </td>
    </tr>
  </table>
</body>
</html>

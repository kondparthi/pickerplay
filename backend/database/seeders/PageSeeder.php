<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

/**
 * Starter CMS pages. Edit them any time in /admin -> Pages.
 * NOTE: Terms & Privacy are generic starting points - have them reviewed for your business.
 */
class PageSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            ['terms', 'Terms & conditions', 'scale', 10, <<<'HTML'
<p>By using this website you agree to these terms. If you do not agree, please do not use the service.</p>
<h2>Using the service</h2>
<ul>
<li>The wheel spinner is provided free of charge, "as is", without warranties of any kind.</li>
<li>You are responsible for the names, text and images you put on a wheel and for how you use the results.</li>
<li>Do not use the service for unlawful gambling, harassment, hate speech or content that is not family-friendly.</li>
</ul>
<h2>Shared wheels</h2>
<p>When you create a share link, the wheel's entries, colours and settings are stored on our servers and can be opened by anyone who has the link. Wheels you publish to the public gallery can be found by anyone. Links that are not opened for 365 days are deleted automatically. We may remove any shared wheel that breaks these terms.</p>
<h2>Accounts</h2>
<p>Keep your password safe. You can delete your account at any time from the My account page.</p>
<h2>Liability</h2>
<p>To the maximum extent allowed by law we are not liable for any loss arising from use of the service, including decisions made using random results.</p>
<h2>Changes</h2>
<p>We may update these terms. Continued use after an update means you accept the new terms.</p>
HTML],
            ['privacy', 'Privacy policy', 'lock', 20, <<<'HTML'
<p>Your privacy matters to us. This policy explains what we collect and why.</p>
<h2>Wheels you do not share</h2>
<p>The wheel you are editing is stored only in your own browser (local storage). It is not sent to our servers unless you save it to an account or create a share link.</p>
<h2>What we store</h2>
<ul>
<li><strong>Accounts:</strong> name, email address and a securely hashed password.</li>
<li><strong>Saved and shared wheels:</strong> the entries, images and settings you chose to save or share.</li>
<li><strong>Usage counters:</strong> an anonymous total of spins, used for the activity counter on the home page.</li>
<li><strong>Feedback:</strong> any message and contact details you send us.</li>
</ul>
<h2>Cookies and advertising</h2>
<p>We may show ads from third-party networks that use cookies to measure and personalise advertising. You can close ads for your session at any time.</p>
<h2>Your rights</h2>
<p>You can export or delete your saved wheels and delete your account at any time. For any privacy request, contact us using the feedback form.</p>
HTML],
            ['faq', 'FAQ', 'help', 30, <<<'HTML'
<h2>How do I spin the wheel?</h2>
<p>Type one entry per line in the box next to the wheel, then click the wheel or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>.</p>
<h2>Is the result really random?</h2>
<p>Yes. Every spin uses your browser's cryptographically secure random number generator (<code>crypto.getRandomValues</code>). Use the "Run 10,000 spins" test on the home page to check the distribution yourself.</p>
<h2>Can some entries have a bigger chance?</h2>
<p>Tick <em>Advanced</em> above the entries list and give entries a weight. An entry with weight 2 is twice as likely as an entry with weight 1.</p>
<h2>How do I stop the same winner being picked again?</h2>
<p>Click <em>Remove</em> in the winner popup, or turn on "Auto-remove winner" in Customize &rarr; After spin.</p>
<h2>Can I use several wheels at once?</h2>
<p>Yes. Click <em>Add wheel</em>. Click a wheel to spin it, or press Ctrl + Enter to spin all wheels together.</p>
<h2>How long do shared links last?</h2>
<p>Shared links stay active as long as they are used. Links not opened for 365 days are deleted.</p>
<h2>Can I import names from Google Sheets?</h2>
<p>Yes. Open <em>More &rarr; Import Google spreadsheet</em>, paste the sheet link (shared as "Anyone with the link can view") and choose the column.</p>
HTML],
            ['api', 'Developer API', 'code', 40, <<<'HTML'
<p>Create and manage wheels from your own apps. Generate an API key in <a href="/account">My account &rarr; API keys</a> and send it with every request in the <code>X-Api-Key</code> header.</p>
<h2>Endpoints</h2>
<table>
<tr><th>Method</th><th>Path</th><th>Description</th></tr>
<tr><td>GET</td><td>/api/v1/wheels</td><td>List your saved wheels</td></tr>
<tr><td>POST</td><td>/api/v1/wheels</td><td>Create a saved wheel</td></tr>
<tr><td>GET</td><td>/api/v1/wheels/{id}</td><td>Read a saved wheel</td></tr>
<tr><td>PUT</td><td>/api/v1/wheels/{id}</td><td>Update a saved wheel</td></tr>
<tr><td>DELETE</td><td>/api/v1/wheels/{id}</td><td>Delete a saved wheel</td></tr>
<tr><td>POST</td><td>/api/v1/shares</td><td>Create a share link (returns url and embed_url)</td></tr>
<tr><td>GET</td><td>/api/v1/shares/{code}</td><td>Read a shared wheel</td></tr>
<tr><td>DELETE</td><td>/api/v1/shares/{code}</td><td>Delete one of your share links</td></tr>
</table>
<h2>Example</h2>
<pre>curl -X POST https://pickerplay.com/api/v1/shares \
  -H "X-Api-Key: pp_your_key" -H "Content-Type: application/json" \
  -d '{"title":"Standup order","entries":["Asha","Ben","Chen"],"visibility":"link_copy"}'</pre>
<h2>Embedding &amp; events</h2>
<p>Embed any shared wheel with an iframe:</p>
<pre>&lt;iframe src="https://pickerplay.com/embed/abc-123" width="600" height="600" style="border:0"&gt;&lt;/iframe&gt;</pre>
<p>The embedded wheel sends a <code>postMessage</code> to the parent page after each spin:</p>
<pre>window.addEventListener('message', (e) =&gt; {
  if (e.origin !== 'https://pickerplay.com') return;
  if (e.data?.type === 'pickerplay:winner') console.log(e.data.winner);
});
// start a spin from the parent page
iframe.contentWindow.postMessage({ type: 'pickerplay:spin' }, 'https://pickerplay.com');</pre>
<p>Rate limit: 60 requests per minute per key.</p>
HTML],
            ['streaming', 'Streaming (OBS / Streamlabs)', 'video', 50, <<<'HTML'
<p>Show the wheel live on your stream as a browser source.</p>
<ol>
<li>Build your wheel, then click <strong>Share</strong> and create a link.</li>
<li>Replace the address's <code>/abc-123</code> part with <code>/embed/abc-123</code>.</li>
<li>In OBS or Streamlabs add a <strong>Browser source</strong>, paste the embed URL, set width and height to 1080 &times; 1080.</li>
<li>The embed page has a transparent background so only the wheel shows. Use "Interact" in OBS to click and spin.</li>
</ol>
<h2>Ideas for streamers</h2>
<ul>
<li>Viewer giveaways - put chat names on the wheel.</li>
<li>Challenge wheels - random handicaps or rules for your next match.</li>
<li>Build randomisers - character, class or loadout.</li>
</ul>
HTML],
            ['blog', 'Blog', 'megaphone', 60, '<p>News, tips and ideas for using the random picker wheel in class, at work and on stream. Posts coming soon.</p>'],
            ['changelog', 'Changelog', 'list', 70, <<<'HTML'
<h2>1.0.0</h2>
<ul>
<li>New wheel engine with weighted entries, images and multiple wheels.</li>
<li>Accounts, saved wheels, share links and public gallery.</li>
<li>Customisable sounds, confetti, colours, themes and centre image.</li>
<li>Google Sheets import, developer API and embeddable wheels.</li>
</ul>
HTML],
        ];

        foreach ($pages as [$slug, $title, $icon, $sort, $content]) {
            Page::updateOrCreate(['slug' => $slug], [
                'title' => $title, 'icon' => $icon, 'sort_order' => $sort, 'content' => $content,
                'show_in_footer' => true, 'is_published' => true,
            ]);
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

/** Three starter articles. Edit or delete them in /admin -> Blog posts. */
class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::where('is_admin', true)->orderBy('id')->first();

        $posts = [
            [
                'title' => '10 Fun Ways Teachers Use a Random Name Picker in Class',
                'category' => 'Classroom',
                'tags' => 'teachers, classroom, random name picker, engagement',
                'excerpt' => 'From cold-calling without the stress to picking line leaders, here are ten classroom routines that get easier – and fairer – with a spinning wheel.',
                'days' => 6,
                'featured' => true,
                'content' => <<<'HTML'
<p>Every teacher knows the moment: you ask a question and the same three hands go up. A random name picker changes the energy in the room instantly – everyone might be next, and nobody can say it wasn't fair.</p>
<h2>1. Cold-calling without the pressure</h2>
<p>Put the class list on the wheel and spin before you ask the question. Students know the choice is random, not personal, which takes the sting out of being picked.</p>
<h2>2. Picking presenters</h2>
<p>Turn on <strong>Auto-remove winner</strong> in Customize so each student presents once before anyone goes twice.</p>
<h2>3. Making fair groups</h2>
<p>Use the <a href="/team-picker">Team Picker</a> to split the class into groups in one click. Tick "Pick a team leader" and every group gets a spokesperson too.</p>
<h2>4. Classroom jobs of the week</h2>
<p>Line leader, board cleaner, plant waterer – spin a second wheel of jobs next to the names wheel and press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to assign both at once.</p>
<h2>5. Choosing the next topic</h2>
<p>Revision day? Put the chapters on the wheel and let it decide what you review first.</p>
<h2>6. Spelling and phonics</h2>
<p>The <a href="/letter-picker">Letter Picker</a> gives a random letter – students race to write five words that start with it.</p>
<h2>7. Maths warm-ups</h2>
<p>Spin the <a href="/number-picker-1-100">1–100 number wheel</a> twice and ask the class to add, subtract or multiply the results.</p>
<h2>8. Rewards and prize draws</h2>
<p>Give every student a ticket for good work during the week and spin for the prize on Friday. Weighted entries let more tickets mean a bigger chance.</p>
<h2>9. Brain breaks</h2>
<p>Fill a wheel with quick activities – stretch, dance, joke, quiz – and spin when energy drops.</p>
<h2>10. Exit tickets</h2>
<p>Spin to choose who shares one thing they learned today before the bell.</p>
<h2>Tip: save your class list</h2>
<p>Sign in and use <strong>Save</strong> so your class list is ready next lesson, on any device – or share a link with a colleague.</p>
HTML,
            ],
            [
                'title' => 'How to Run a Fair Online Giveaway with a Spinning Wheel',
                'category' => 'Giveaways',
                'tags' => 'giveaway, contest, instagram, raffle, winner picker',
                'excerpt' => 'A step-by-step guide to collecting entries, spinning live and proving to your followers that the winner was picked fairly.',
                'days' => 3,
                'featured' => false,
                'content' => <<<'HTML'
<p>Giveaways grow your audience – but only if people trust the result. A live spin on a random wheel is the simplest way to show the draw was fair.</p>
<h2>Step 1: Collect the entries</h2>
<p>Export comments or form responses to a spreadsheet. If you use Google Sheets, open <strong>More → Import Google spreadsheet</strong> and paste the link – every name lands on the wheel in seconds.</p>
<h2>Step 2: Remove duplicates (or don't)</h2>
<p>If your rules allow one entry per person, untick <em>Display duplicates</em> in Customize. If extra entries are allowed, keep duplicates – each one counts as another chance.</p>
<h2>Step 3: Spin live</h2>
<p>Go live or record your screen, switch to Fullscreen and spin. The ticking sound and confetti make it fun to watch.</p>
<h2>Step 4: Share the proof</h2>
<p>Click <strong>Share</strong> to create a link to the exact wheel you used. Post it alongside the winner announcement so anyone can check the entries.</p>
<h2>Why the result is fair</h2>
<p>Every spin uses the browser's cryptographically secure random generator, the same kind of randomness used in security software. You can even run the 10,000-spin test on the home page to show the distribution.</p>
<h2>Bonus: picking runners-up</h2>
<p>Click <em>Remove</em> after the first winner and spin again for second and third place.</p>
HTML,
            ],
            [
                'title' => 'Team Picker Guide: How to Split a Group into Fair Teams',
                'category' => 'Guides',
                'tags' => 'team picker, random teams, groups, sports, workshops',
                'excerpt' => 'Balanced teams in seconds: how to use team size, leaders and labels to create groups everyone agrees are fair.',
                'days' => 1,
                'featured' => false,
                'content' => <<<'HTML'
<p>Picking teams by hand takes time and someone always ends up feeling left out. A random team generator does it in one click – and nobody can argue with the result.</p>
<h2>Choose teams or team size</h2>
<p>In the <a href="/team-picker">Team Picker</a>, choose <em>Number of teams</em> when you know how many groups you need, or <em>Members per team</em> for pairs, trios or squads of five. Team sizes never differ by more than one person.</p>
<h2>Pick a leader for every team</h2>
<p>Tick <strong>Pick a team leader</strong> and each group gets a random captain, marked with a crown.</p>
<h2>Balance by gender or skill</h2>
<p>Add a label after a comma – for example <code>Asha, girl</code> or <code>Ravi, expert</code> – and tick <strong>Balance teams by label</strong>. Each label is spread evenly across all teams.</p>
<h2>Use only some of the names</h2>
<p>Have 25 people but only room for 10 players? Set <em>Use only</em> to 10 and the picker chooses a random subset first.</p>
<h2>Share the result</h2>
<p>Copy the teams into WhatsApp or download a CSV for Excel. Use Full width to show the teams on a projector.</p>
HTML,
            ],
        ];

        foreach ($posts as $p) {
            $slug = \Illuminate\Support\Str::slug($p['title']);
            if (Post::where('slug', $slug)->exists()) {
                continue; // already seeded - never overwrite edits
            }
            (new Post)->fill([
                'slug' => $slug,
                'author_id' => $author?->id,
                'title' => $p['title'],
                'excerpt' => $p['excerpt'],
                'content' => $p['content'],
                'category' => $p['category'],
                'tags' => $p['tags'],
                'status' => 'published',
                'published_at' => now()->subDays($p['days']),
                'is_featured' => $p['featured'],
                'reading_minutes' => Post::readingMinutes($p['content']),
            ])->save();
        }
    }
}

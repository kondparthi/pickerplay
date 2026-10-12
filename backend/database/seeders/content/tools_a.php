<?php

// Rewritten SEO content for the picker pages (part A).
// Layout rule used by the frontend: text before the first <h2> = intro, every <h2> starts a new card.

return [

'yes-no-wheel' => [
    'heading' => 'Yes or No Wheel – Spin to Decide',
    'meta_title' => 'Yes or No Wheel – Spin the Wheel to Decide | PickerPlay',
    'meta_description' => 'Ask any question, spin the Yes or No wheel and get an instant, unbiased answer. Free, fair 50/50 decision maker with sounds and confetti.',
    'content' => <<<'HTML'
<p class="lead">Pizza or burger? Text back or wait? Go out or stay in?</p>
<p>The Yes or No Wheel ends decision fatigue in one tap. Think of your question, spin the wheel and get a clear <strong>YES</strong> or <strong>NO</strong> in seconds – completely random, completely fair.</p>

<h2>What is the Yes or No Wheel?</h2>
<p>It is a free online decision maker with two equal slices: Yes and No. Every spin uses a cryptographically secure random generator, so each answer has an exact 50% chance. No algorithm leaning one way, no favourites.</p>

<h2>Why use a Yes or No picker?</h2>
<ul>
<li><strong>Stop overthinking:</strong> small choices take three seconds instead of thirty minutes.</li>
<li><strong>Make decisions fun:</strong> sounds, suspense and confetti turn a boring choice into a mini game.</li>
<li><strong>Totally fair:</strong> perfect when two people can't agree – let the wheel be the referee.</li>
<li><strong>Works everywhere:</strong> phone, tablet, laptop or classroom smartboard. No app, no sign-up.</li>
</ul>

<h2>How to use it</h2>
<ol>
<li>Think of a yes/no question.</li>
<li>Click the wheel or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>.</li>
<li>Read your answer – or spin best of three!</li>
</ol>
<p>Want more options? Try the <a href="/yes-no-maybe-wheel">Yes No Maybe Wheel</a>.</p>

<h2>Popular ways to use it</h2>
<ul>
<li>Daily choices – what to eat, what to wear, whether to go out.</li>
<li>Classroom games and quick polls.</li>
<li>Party games, dares and forfeits.</li>
<li>Live streams and YouTube Shorts challenges.</li>
</ul>

<h2>Frequently asked questions</h2>
<details><summary>Is the Yes or No wheel really random?</summary><p>Yes. Every spin uses your browser's secure random generator, giving Yes and No exactly equal chances.</p></details>
<details><summary>Can I change the answers?</summary><p>Yes – edit the entries on the right. Add "Maybe", "Ask again" or anything you like.</p></details>
<details><summary>Can I make Yes more likely?</summary><p>Tick <em>Advanced</em> and give Yes a higher weight. Great for fun "rigged" party wheels.</p></details>
<details><summary>Does it save my questions?</summary><p>No. Everything stays in your browser.</p></details>
HTML,
],

'yes-no-maybe-wheel' => [
    'heading' => 'Yes, No or Maybe Wheel',
    'meta_title' => 'Yes No Maybe Wheel – Random Decision Spinner | PickerPlay',
    'meta_description' => 'Spin the Yes No Maybe wheel for a quick, playful answer to any question. Three equal options, free and fair.',
    'content' => <<<'HTML'
<p class="lead">Sometimes the honest answer is "maybe".</p>
<p>This wheel adds a third slice to the classic yes/no spinner, so every spin has a one-in-three chance of Yes, No or Maybe – perfect for suspense, party games and light-hearted decisions.</p>

<h2>When to use Yes / No / Maybe</h2>
<ul>
<li>Magic 8-ball style fortune telling with friends.</li>
<li>Party games where "maybe" means a bonus round.</li>
<li>Classroom ice-breakers and quick opinion polls.</li>
<li>Deciding whether to postpone – Maybe = try again tomorrow.</li>
</ul>

<h2>How to use it</h2>
<ol>
<li>Ask your question out loud.</li>
<li>Spin the wheel.</li>
<li>If you land on Maybe, spin again or let the group vote.</li>
</ol>

<h2>Make it your own</h2>
<p>Rename the slices to "Definitely", "Never" and "Ask later", change the colours in <strong>Customize</strong>, or give one answer more weight in <em>Advanced</em> mode.</p>
HTML,
],

'number-picker' => [
    'heading' => 'Number Picker – Random Number Wheel',
    'meta_title' => 'Random Number Picker Wheel – Pick a Number 1-10 | PickerPlay',
    'meta_description' => 'Spin the number picker wheel to get a truly random number. Perfect for giveaways, games, classrooms and lucky draws. Free and unbiased.',
    'content' => <<<'HTML'
<p class="lead">Need a random number – fast and fair?</p>
<p>The Number Picker Wheel gives you a truly random number in one spin. It starts at 1–10, but you can type any list of numbers you like. Fair, transparent and far more exciting than a plain random number generator.</p>

<h2>What is a number picker?</h2>
<p>A number picker is a free online tool that selects one number at random from a range you choose. Every number has exactly the same chance, thanks to a cryptographically secure random generator. Also searched as: random number wheel, number randomizer, pick a number, number generator wheel.</p>

<h2>Why use a wheel instead of guessing?</h2>
<ul>
<li><strong>100% fair:</strong> no patterns, no favourites – ideal for prize draws.</li>
<li><strong>Ends arguments:</strong> who goes first, who gets the last slice? The wheel decides.</li>
<li><strong>More fun:</strong> sounds and confetti make it great for videos and classrooms.</li>
<li><strong>Any range:</strong> 1–10, 1–100, ticket numbers, seat numbers – you choose.</li>
</ul>

<h2>Best ways to use the number wheel</h2>
<ol>
<li><strong>Giveaways & raffles</strong> – give every entry a number and spin live on stream.</li>
<li><strong>Classroom</strong> – pick a roll number, a page or a maths problem.</li>
<li><strong>Bingo, Housie & Tambola</strong> – use it as a digital number caller (turn on auto-remove).</li>
<li><strong>Office</strong> – choose a speaker or presentation order.</li>
<li><strong>Sports & fantasy leagues</strong> – jersey numbers and draft order.</li>
<li><strong>Daily life</strong> – "pick a number for what we eat tonight".</li>
</ol>

<h2>How to use it in 3 steps</h2>
<ol>
<li>Keep 1–10 or type your own numbers (one per line). Need bigger? Try <a href="/number-picker-1-100">1–100</a>.</li>
<li>Click the wheel to spin.</li>
<li>Your number appears in the popup. Click <em>Remove</em> to avoid repeats.</li>
</ol>

<h2>Frequently asked questions</h2>
<details><summary>How do I avoid the same number twice?</summary><p>Click Remove after each spin, or turn on "Auto-remove winner" in Customize → After spin.</p></details>
<details><summary>Can I record the spin as proof?</summary><p>Yes – use Fullscreen and record your screen. Every result is also listed in the Results tab.</p></details>
HTML,
],

'number-picker-1-100' => [
    'heading' => 'Random Number Generator 1–100',
    'meta_title' => 'Random Number 1-100 Wheel – Spin to Pick a Number | PickerPlay',
    'meta_description' => 'Pick a random number between 1 and 100 with a spin. Fair, free and perfect for lucky draws, bingo and classroom games.',
    'content' => <<<'HTML'
<p class="lead">One spin, one hundred possibilities.</p>
<p>This wheel holds every whole number from 1 to 100. Spin it to get a fair random number for lucky draws, guessing games, bingo or classroom activities.</p>

<h2>Great for</h2>
<ul>
<li>Lucky draws with up to 100 tickets.</li>
<li>"Guess my number" games and maths lessons on probability.</li>
<li>Bingo and Tambola calling – turn on auto-remove so numbers never repeat.</li>
<li>Choosing a random page, question or seat number.</li>
</ul>

<h2>Tips</h2>
<ul>
<li>Lower "Max names visible" in Customize if you prefer a cleaner wheel – every number still has the same chance.</li>
<li>Run the 10,000-spin test on the home page to see how evenly results spread.</li>
<li>Need a smaller range? Use the <a href="/number-picker">1–10 Number Picker</a>.</li>
</ul>
HTML,
],

'letter-picker' => [
    'heading' => 'Alphabet Picker – Random Letter Wheel A–Z',
    'meta_title' => 'Random Letter Picker Wheel – Alphabet Spinner A to Z | PickerPlay',
    'meta_description' => 'Spin the alphabet wheel to pick a random letter from A to Z. Perfect for word games, Name Place Animal Thing, phonics and challenges.',
    'content' => <<<'HTML'
<p class="lead">Can't pick a letter? Let the wheel spin the alphabet.</p>
<p>The Alphabet Picker gives you a random letter from A to Z in one spin – ideal for word games, classroom phonics, naming ideas and viral A–Z challenges. Fast, free and fair, no login needed.</p>

<h2>What is an alphabet picker?</h2>
<p>A free online wheel that selects one of the 26 letters of the English alphabet, each with an equal 1-in-26 chance. Call it a letter picker, A–Z spinner or random letter generator – it ends the debate instantly.</p>

<h2>Why use a random letter wheel?</h2>
<ul>
<li><strong>Truly random:</strong> no pattern, no favourites.</li>
<li><strong>Saves time:</strong> teachers and parents get a letter in two seconds.</li>
<li><strong>More exciting:</strong> a spinning wheel adds suspense a plain list can't.</li>
<li><strong>Works on all devices:</strong> phone, tablet, desktop or smartboard.</li>
</ul>

<h2>Top ways to use the letter wheel</h2>
<ol>
<li><strong>Phonics & spelling</strong> – spin a letter and say five words that start with it.</li>
<li><strong>Name Place Animal Thing</strong> – the classic game needs a fair starting letter.</li>
<li><strong>Word games</strong> – Scattergories, hangman hints, "words starting with…".</li>
<li><strong>Baby, team or username ideas</strong> – spin "S" → Sophia, Sam, Stella.</li>
<li><strong>Giveaways</strong> – pick the winning initial for an A–Z contest.</li>
<li><strong>Creator challenges</strong> – eat, wear or visit only things with that letter for a day.</li>
</ol>

<h2>How to use it</h2>
<ol>
<li>Keep A–Z or remove letters you don't want (X, Z…).</li>
<li>Click the wheel to spin.</li>
<li>Press <em>Remove</em> to exclude that letter from the next round.</li>
</ol>
HTML,
],

'color-picker' => [
    'heading' => 'Random Color Picker – Spin for a Color',
    'meta_title' => 'Random Color Picker Wheel – Spin to Pick a Color | PickerPlay',
    'meta_description' => 'Stuck choosing a color? Spin the random color wheel for art challenges, outfits, design inspiration and games. Free and instant.',
    'content' => <<<'HTML'
<p class="lead">Too many shades, zero ideas? Spin one.</p>
<p>The Random Color Picker Wheel chooses a colour for you in one second – each slice is painted in the colour it names. Use it for drawing challenges, outfit decisions, room ideas or party games.</p>

<h2>What is a random color picker?</h2>
<p>A free online wheel that randomly selects a colour from the list. Every colour has an equal chance, so it's perfect when you want inspiration rather than another hour of scrolling through swatches.</p>

<h2>Why use a color wheel?</h2>
<ul>
<li><strong>Ends colour decision fatigue</strong> – designers and artists get unstuck in seconds.</li>
<li><strong>Unbiased</strong> – fair for art battles, games and giveaways.</li>
<li><strong>Instant inspiration</strong> – a surprise colour can spark a whole new idea.</li>
<li><strong>Free, fast, no sign-up</strong> – works on mobile and desktop.</li>
</ul>

<h2>Ways to use the random color picker</h2>
<ol>
<li><strong>Art & drawing challenges</strong> – spin three colours and create using only those.</li>
<li><strong>Kids & classroom</strong> – find five things in the room of that colour.</li>
<li><strong>Outfit of the day</strong> – let the wheel pick your shirt or nail paint.</li>
<li><strong>Room decor</strong> – choose a feature wall or LED light colour.</li>
<li><strong>Games & penalties</strong> – decide who goes next or the forfeit colour.</li>
<li><strong>Branding ideas</strong> – quick palette starting points without a designer.</li>
</ol>

<h2>Tips</h2>
<ul>
<li>Add your own colours – type the name and set its slice colour in <em>Advanced</em> mode.</li>
<li>Use Customize → Appearance to apply a ready-made palette to the whole wheel.</li>
</ul>
HTML,
],

'country-picker' => [
    'heading' => 'Random Country Picker – Spin the World',
    'meta_title' => 'Random Country Picker Wheel – Spin to Pick a Country | PickerPlay',
    'meta_description' => 'Spin the country wheel to pick a random country from all 195 nations. Travel ideas, geography quizzes, food challenges and games.',
    'content' => <<<'HTML'
<p class="lead">Can't decide where to travel next?</p>
<p>The Random Country Picker spins through every country in the world and lands on one at random – from Afghanistan to Zimbabwe. Use it for travel inspiration, geography quizzes, food nights or viral country challenges.</p>

<h2>What is a country picker wheel?</h2>
<p>A free online tool that randomly selects a country from a list of all 195 nations. Just click the wheel and it lands on a random country in seconds. Also searched as: random country generator, country wheel, country randomizer, spin the globe.</p>

<h2>Why use a random country picker?</h2>
<ul>
<li><strong>Fair and truly random</strong> – every country has the same chance.</li>
<li><strong>Travel inspiration</strong> – stuck between Bali and Bangkok? Let the wheel choose.</li>
<li><strong>Learning made fun</strong> – teachers use it for flags, capitals and currencies.</li>
<li><strong>Content ideas</strong> – the "random country challenge" is a creator favourite.</li>
<li><strong>Works anywhere</strong> – no app, no login, any device.</li>
</ul>

<h2>Best ways to use the country wheel</h2>
<ol>
<li><strong>Travel & bucket lists</strong> – spin your next destination.</li>
<li><strong>Geography class</strong> – name the capital, flag or currency of the result.</li>
<li><strong>Food challenges</strong> – cook that country's national dish tonight.</li>
<li><strong>Quiz & guessing games</strong> – great with GeoGuessr-style games.</li>
<li><strong>Office sweepstakes</strong> – assign World Cup teams or markets fairly.</li>
<li><strong>Language learning</strong> – learn "hello" in the official language.</li>
<li><strong>Story writing</strong> – pick a setting for your next story or game.</li>
</ol>

<h2>How to use it in 3 steps</h2>
<ol>
<li>Keep all countries, or delete some to focus on one continent.</li>
<li>Click the wheel or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>.</li>
<li>Click <em>Remove</em> to make sure the next spin lands somewhere new.</li>
</ol>
<p class="muted">Where will the wheel take you?</p>
HTML,
],

'state-picker' => [
    'heading' => 'Random US State Picker',
    'meta_title' => 'Random US State Picker Wheel – Spin the 50 States | PickerPlay',
    'meta_description' => 'Spin the wheel to pick one of the 50 US states at random. Road trips, geography lessons, quizzes and games.',
    'content' => <<<'HTML'
<p class="lead">Fifty states, one spin.</p>
<p>The US State Picker lands on a random state from Alabama to Wyoming. Use it to plan road trips, study geography or add a fair twist to quizzes and games.</p>

<h2>Ideas for the state wheel</h2>
<ul>
<li><strong>Road-trip roulette</strong> – spin your next weekend destination.</li>
<li><strong>Geography lessons</strong> – capitals, nicknames and state flags.</li>
<li><strong>Food challenges</strong> – cook a famous dish from the state you land on.</li>
<li><strong>Trivia nights</strong> – pick the topic of the next round.</li>
</ul>

<h2>Tips</h2>
<ul>
<li>Remove each state after it's picked to visit all 50 without repeats.</li>
<li>Add Washington D.C. or US territories by typing them on a new line.</li>
</ul>
HTML,
],

];

<?php

/*
 * Trust & legal pages (AdSense readiness, Nov 2026).
 * Used by PageSeeder (fresh installs) and by the 2026_11_05 data migration (live site).
 * slug => [title, icon, sort_order, meta_description, html]
 *
 * These describe how PickerPlay actually works. If you add a new tracker, ad network or
 * data collection, update the Privacy Policy and Cookie Policy too.
 */

$updated = 'Last updated: 5 November 2026';

return [

'about' => ['About Us', 'help', 5, 'PickerPlay is a free set of random picker tools – wheel spinner, team picker, polling wheel and more – built to make everyday choices quick and fun.', <<<HTML
<p><strong>Welcome to PickerPlay.</strong></p>
<p>PickerPlay was created for those moments when a decision is hard to make – or when it simply needs to be made without favourites. Who answers the next question in class? Who wins the giveaway? Which team does everyone play on? Where should the office go for lunch? You add your options, spin the wheel and let a random result decide.</p>
<p>Our goal is simple: give teachers, businesses, streamers, families and friends a free, fast and transparent way to make choices, and make those moments a little more fun.</p>
<h2>What you can do on PickerPlay</h2>
<p>The main <a href="/">Wheel Spinner</a> spins any list of names, ideas or tasks. Around it we have built focused tools for specific needs:</p>
<ul>
<li><strong>Groups and decisions:</strong> <a href="/team-picker">Team Picker</a>, <a href="/polling-wheel">Polling Wheel</a>, <a href="/yes-no-wheel">Yes or No Wheel</a>, <a href="/yes-no-maybe-wheel">Yes No Maybe Wheel</a></li>
<li><strong>Numbers and letters:</strong> <a href="/number-picker">Random Number Picker</a>, <a href="/number-picker-1-100">Random Number 1–100</a>, <a href="/letter-picker">Random Letter Picker</a></li>
<li><strong>Games and fun:</strong> <a href="/truth-or-dare-wheel">Truth or Dare Wheel</a>, <a href="/dice-roller-wheel">Dice Roller Wheel</a>, <a href="/coin-flip-wheel">Heads or Tails</a>, <a href="/what-to-eat-wheel">What Should I Eat Wheel</a></li>
<li><strong>Places, colours and days:</strong> <a href="/country-picker">Random Country Picker</a>, <a href="/state-picker">Random US State Picker</a>, <a href="/color-picker">Random Color Picker</a>, <a href="/day-picker">Random Day Picker</a></li>
<li><strong>Sports:</strong> <a href="/nba-team-picker">NBA Team Picker</a>, <a href="/nfl-team-picker">NFL Team Picker</a>, <a href="/mlb-team-picker">MLB Team Picker</a></li>
</ul>
<h2>How results are chosen</h2>
<p>Every result is picked with your browser's built-in secure random number generator (the Web Crypto API). Each entry's chance matches its share of the wheel, so equal entries have equal chances. Random results can repeat – the same name can come up twice in a row – which is how genuine randomness behaves. You can test the spread yourself with the "Run 7,000 spins" button on the home page.</p>
<h2>Who uses PickerPlay</h2>
<p><strong>Teachers</strong> pick students, form groups and run classroom games. <strong>Businesses and marketers</strong> draw giveaway winners and run team polls. <strong>Streamers</strong> run viewer challenges. <strong>Families and friends</strong> settle everyday choices, from dinner plans to game nights.</p>
<h2>Entertainment only</h2>
<p>PickerPlay is for entertainment and everyday decision-making. It is not a gambling service, and we do not offer real-money prizes. Please read our <a href="/page/disclaimer">Disclaimer</a>.</p>
<h2>Your privacy</h2>
<p>Wheels you create stay in your own browser unless you choose to save them to an account or share them with a link. Read more in our <a href="/page/privacy">Privacy Policy</a>.</p>
<h2>Contact us</h2>
<p>Have an idea for a new picker, found a problem or want to work with us? Use our <a href="/contact">contact page</a> or email <a href="mailto:support@pickerplay.com">support@pickerplay.com</a>.</p>
HTML],

'privacy' => ['Privacy Policy', 'lock', 20, 'How PickerPlay collects, uses and protects information, including cookies, Google AdSense advertising and analytics.', <<<HTML
<p><em>{$updated}</em></p>
<p>This Privacy Policy explains what information PickerPlay ("we", "us") collects when you use pickerplay.com, how we use it, and the choices you have. By using the website you agree to this policy.</p>

<h2>1. Information we collect</h2>
<h3>Information stored only in your browser</h3>
<p>The wheels you edit, your entries, results, settings (such as dark mode and language) and your cookie choice are stored in your own browser's local storage. They are not sent to us unless you save a wheel to an account, create a share link or publish to the gallery.</p>
<h3>Information you give us</h3>
<ul>
<li><strong>Account:</strong> your name, email address and a securely hashed password, if you create an account.</li>
<li><strong>Saved and shared wheels:</strong> the entries, images and settings of wheels you save, share or publish.</li>
<li><strong>Polls:</strong> the question and answers of polls you create; for each vote, the chosen answer, a one-way coded device identifier (to allow one vote per device) and your name only if the poll creator asks for it.</li>
<li><strong>Contact and feedback messages:</strong> your name, email address, message, the page you were on and your IP address (to prevent spam).</li>
<li><strong>Uploaded images:</strong> images you add to wheels.</li>
</ul>
<h3>Information collected automatically</h3>
<ul>
<li><strong>Visit statistics:</strong> we count page views and spins per page. To count unique visitors we use a daily-changing coded value; we do not store raw IP addresses for statistics, and these codes are deleted after 35 days.</li>
<li><strong>Server logs:</strong> our hosting provider keeps standard technical logs (such as IP address, browser type and the time of the request) for security and troubleshooting.</li>
<li><strong>Cookies and similar technologies:</strong> see section 3.</li>
</ul>

<h2>2. How we use information</h2>
<ul>
<li>To run the tools, save and share your wheels and polls, and keep your account working.</li>
<li>To answer your messages and feedback.</li>
<li>To understand which pages and tools are used, so we can improve the website.</li>
<li>To show advertising that helps keep PickerPlay free (see section 4).</li>
<li>To protect the website against spam, abuse and security threats.</li>
</ul>
<p>We do not sell your personal information.</p>

<h2>3. Cookies and tracking technologies</h2>
<p>Cookies are small files stored on your device. We and our partners use them for these purposes:</p>
<ul>
<li><strong>Necessary:</strong> keeping you signed in, remembering your settings and your cookie choice. These cannot be switched off.</li>
<li><strong>Analytics:</strong> if Google Analytics is enabled, it helps us understand how the website is used. Analytics cookies are set only after you choose "Accept all" in our cookie box.</li>
<li><strong>Advertising:</strong> Google AdSense and its partners may use cookies to show and measure ads (see section 4).</li>
</ul>
<p>When you first visit, our cookie box lets you choose "Accept all" or "Only necessary". You can change your choice at any time using <strong>Cookie settings</strong> at the bottom of every page. More detail is in our <a href="/page/cookie-policy">Cookie Policy</a>.</p>

<h2>4. Google AdSense and third-party advertising</h2>
<ul>
<li>We use Google AdSense to show advertisements on this website.</li>
<li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.</li>
<li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.</li>
<li>You may opt out of personalised advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ads Settings</a>. You can also learn how Google uses information from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">How Google uses information from sites or apps that use our services</a>, and about Google's advertising cookies at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">policies.google.com/technologies/ads</a>.</li>
<li>Other third-party ad vendors or networks may also use cookies; you can opt out of some of them at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">www.aboutads.info</a>.</li>
<li>If you choose "Only necessary" in our cookie box, Google is asked to show non-personalised or limited ads.</li>
</ul>

<h2>5. Google Analytics</h2>
<p>If enabled, Google Analytics collects information such as pages visited, time on page and device type. Google's privacy practices are described at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a>. You can install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics opt-out browser add-on</a>.</p>

<h2>6. Third-party services</h2>
<ul>
<li><strong>Google</strong> – advertising (AdSense) and, if enabled, analytics.</li>
<li><strong>Unsplash</strong> – the optional image search in the image picker sends your search words to Unsplash.</li>
<li><strong>Google Sheets</strong> – only if you use "Import Google spreadsheet", we read the sheet link you provide.</li>
<li><strong>Our hosting provider</strong> – stores the website and its database.</li>
</ul>
<p>Links to other websites are provided for convenience; we are not responsible for their content or privacy practices.</p>

<h2>7. Children's privacy</h2>
<p>PickerPlay is a general-audience website that teachers often use in class. We do not knowingly collect personal information from children under 13 (or the minimum age in your country). Accounts are intended for adults, such as teachers and parents. If you believe a child has given us personal information, contact us and we will delete it.</p>

<h2>8. How long we keep information</h2>
<ul>
<li>Visitor-count codes: 35 days.</li>
<li>Share links: deleted when not opened for 365 days.</li>
<li>Polls: until they expire or are deleted by their creator.</li>
<li>Accounts and saved wheels: until you delete them.</li>
<li>Contact and feedback messages: as long as needed to respond and keep a record.</li>
</ul>

<h2>9. Data protection</h2>
<p>We use HTTPS encryption, hashed passwords and access controls to protect information. No method of transmission or storage is completely secure, but we take reasonable steps to protect your data.</p>

<h2>10. Your rights and choices</h2>
<ul>
<li>Clear your browser's local storage to remove wheels stored on your device.</li>
<li>Delete saved wheels, share links and your account from the My account page.</li>
<li>Change your cookie choice at any time with <strong>Cookie settings</strong>.</li>
<li>Ask us to access, correct or delete your personal information by emailing <a href="mailto:support@pickerplay.com">support@pickerplay.com</a>.</li>
</ul>
<p>Depending on where you live (for example the EU/UK under GDPR, California under CCPA, or India under the DPDP Act), you may have additional rights. Contact us to use them.</p>

<h2>11. Changes to this policy</h2>
<p>We may update this policy from time to time. The date at the top shows the latest version. Continued use of the website after a change means you accept the updated policy.</p>

<h2>12. Contact us</h2>
<p>Questions about this policy? Email <a href="mailto:support@pickerplay.com">support@pickerplay.com</a> or use our <a href="/contact">contact page</a>.</p>
HTML],

'terms' => ['Terms & Conditions', 'scale', 10, 'The rules for using PickerPlay: acceptable use, random results, shared wheels, intellectual property and liability.', <<<HTML
<p><em>{$updated}</em></p>
<p>These Terms & Conditions ("Terms") apply to your use of pickerplay.com ("PickerPlay", "we", "us"). By using the website you agree to these Terms. If you do not agree, please do not use the website.</p>

<h2>1. The service</h2>
<p>PickerPlay provides free online tools for random selection and decision-making, including a wheel spinner, team picker, polling wheel and preset picker wheels. The tools are provided free of charge and "as is".</p>

<h2>2. Your responsibilities</h2>
<ul>
<li>You are responsible for the names, text and images you put on a wheel or poll, and for how you use the results.</li>
<li>Only add personal information about other people (such as names) when you have the right to do so.</li>
<li>When you run a giveaway or competition, you are responsible for its rules, eligibility, prizes and compliance with local law and platform rules.</li>
</ul>

<h2>3. Acceptable use</h2>
<p>You may not use PickerPlay to:</p>
<ul>
<li>run unlawful gambling, betting or real-money games;</li>
<li>harass, bully, threaten or discriminate against anyone;</li>
<li>share hateful, violent, sexual, illegal or otherwise harmful content;</li>
<li>upload content you do not have the right to use;</li>
<li>spam, scrape, overload or try to break the website or its API;</li>
<li>create misleading wheels or polls designed to trick people.</li>
</ul>
<p>We may remove content and block access that breaks these rules.</p>

<h2>4. Random results</h2>
<p>Results are generated by your browser's secure random number generator. Each entry's chance matches its share of the wheel. Random results can repeat and are not guaranteed to be evenly spread over a small number of spins. PickerPlay is for entertainment and everyday decisions; do not rely on it for legal, financial, medical or other important decisions. See our <a href="/page/disclaimer">Disclaimer</a>.</p>

<h2>5. Shared wheels, gallery and polls</h2>
<p>When you create a share link or poll, its content is stored on our servers and can be opened by anyone with the link. Wheels you publish to the public gallery can be seen by anyone. Share links not opened for 365 days are deleted automatically. We may remove any shared content that breaks these Terms.</p>

<h2>6. Accounts</h2>
<p>Keep your password secure and do not share your account. You can delete your account at any time from the My account page.</p>

<h2>7. Intellectual property</h2>
<p>The PickerPlay name, logo, design and website content belong to PickerPlay. You keep the rights to the content you add. Sports league and team names used in our team pickers are trademarks of their respective owners; PickerPlay is not affiliated with, endorsed by or sponsored by any league or team.</p>

<h2>8. Third-party services and advertising</h2>
<p>The website shows ads from Google AdSense and may link to third-party websites. We are not responsible for third-party content, products or services.</p>

<h2>9. Availability and accuracy</h2>
<p>We try to keep PickerPlay available and accurate but do not guarantee that it will be uninterrupted, error-free or always available. We may change or stop any feature at any time.</p>

<h2>10. Limitation of liability</h2>
<p>To the maximum extent allowed by law, PickerPlay is not liable for any loss or damage arising from your use of the website, including decisions made using random results or the loss of wheels stored in your browser.</p>

<h2>11. Changes to these Terms</h2>
<p>We may update these Terms. The date at the top shows the latest version. Continued use after an update means you accept the new Terms.</p>

<h2>12. Contact</h2>
<p>Questions about these Terms? Email <a href="mailto:support@pickerplay.com">support@pickerplay.com</a> or use our <a href="/contact">contact page</a>.</p>
HTML],

'disclaimer' => ['Disclaimer', 'flag', 25, 'PickerPlay tools are for entertainment and everyday decision-making only. No gambling, no real-money prizes.', <<<HTML
<p><em>{$updated}</em></p>
<h2>Entertainment and decision-making only</h2>
<p>PickerPlay's wheels, pickers and polls are for entertainment and everyday decision-making only. PickerPlay is not a gambling website: there is no betting, no payment to play and no real-money prizes offered by PickerPlay.</p>
<h2>How results work – and their limits</h2>
<ul>
<li>Results are generated by your browser's secure random number generator. Each entry's chance matches its share of the wheel.</li>
<li>Random results can repeat, and over a small number of spins they will not be evenly spread.</li>
<li>Results are not advice. Do not use PickerPlay for legal, financial, medical, safety or other important decisions.</li>
</ul>
<h2>Giveaways and competitions</h2>
<p>If you use PickerPlay to choose a giveaway or contest winner, you – not PickerPlay – are the organiser. You are responsible for the rules, prizes, eligibility and compliance with local law and the rules of any social platform you use.</p>
<h2>Games and challenges</h2>
<p>Party games such as the Truth or Dare Wheel are meant to be light-hearted. Only take part in challenges that are safe, legal and comfortable for everyone. Anyone may skip any question or dare. Younger players should play with adult supervision.</p>
<h2>Sports team pickers</h2>
<p>Team and league names in the NBA, NFL and MLB pickers are trademarks of their respective owners and are used only to identify the teams. PickerPlay is not affiliated with, endorsed by or sponsored by any league or team. No team logos are used.</p>
<h2>External links and ads</h2>
<p>The website shows ads and may link to other websites. We do not control and are not responsible for their content.</p>
<h2>Contact</h2>
<p>Questions? Email <a href="mailto:support@pickerplay.com">support@pickerplay.com</a>.</p>
HTML],

'cookie-policy' => ['Cookie Policy', 'shield', 22, 'How PickerPlay and partners such as Google use cookies and local storage, and how to change your choice.', <<<HTML
<p><em>{$updated}</em></p>
<p>This Cookie Policy explains how PickerPlay uses cookies and similar technologies on pickerplay.com.</p>
<h2>What are cookies?</h2>
<p>Cookies are small text files stored on your device when you visit a website. We also use your browser's local storage, which works in a similar way.</p>
<h2>Cookies we use</h2>
<h3>1. Necessary</h3>
<p>Needed for the website to work: your wheels, entries, settings, dark/light mode, language, sign-in and your cookie choice. These are stored in your browser and cannot be switched off.</p>
<h3>2. Analytics</h3>
<p>Help us understand which pages and tools are used. We use our own cookie-free visitor counter and, if enabled, Google Analytics. Google Analytics cookies are set only if you choose "Accept all".</p>
<h3>3. Advertising</h3>
<p>Google AdSense shows ads that keep PickerPlay free. With your consent, Google and its partners may use cookies to show ads based on your interests. If you choose "Only necessary", you will see non-personalised or limited ads.</p>
<h2>Changing your choice</h2>
<p>Click <strong>Cookie settings</strong> at the bottom of any page to change your choice at any time. You can also delete cookies in your browser settings.</p>
<h2>Third-party cookies</h2>
<p>Google's use of advertising cookies is described at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">policies.google.com/technologies/ads</a>. You can manage personalised ads at <a href="https://adssettings.google.com" target="_blank" rel="noopener">adssettings.google.com</a>.</p>
<h2>Contact</h2>
<p>Questions about this policy? Email <a href="mailto:support@pickerplay.com">support@pickerplay.com</a>.</p>
HTML],

];

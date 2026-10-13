<?php

namespace Database\Seeders;

use App\Models\ToolPreset;
use App\Services\WheelConfig;
use Illuminate\Database\Seeder;

/**
 * PickerPlay's preset picker pages. Each gets its own URL (/yes-no-wheel ...),
 * its own SEO title/description and its own content block. Edit in /admin -> Picker tools.
 */
class ToolPresetSeeder extends Seeder
{
    public function run(): void
    {
        $countries = 'Afghanistan,Albania,Algeria,Andorra,Angola,Antigua and Barbuda,Argentina,Armenia,Australia,Austria,Azerbaijan,Bahamas,Bahrain,Bangladesh,Barbados,Belarus,Belgium,Belize,Benin,Bhutan,Bolivia,Bosnia and Herzegovina,Botswana,Brazil,Brunei,Bulgaria,Burkina Faso,Burundi,Cabo Verde,Cambodia,Cameroon,Canada,Central African Republic,Chad,Chile,China,Colombia,Comoros,Congo,Costa Rica,Croatia,Cuba,Cyprus,Czechia,Denmark,Djibouti,Dominica,Dominican Republic,DR Congo,Ecuador,Egypt,El Salvador,Equatorial Guinea,Eritrea,Estonia,Eswatini,Ethiopia,Fiji,Finland,France,Gabon,Gambia,Georgia,Germany,Ghana,Greece,Grenada,Guatemala,Guinea,Guinea-Bissau,Guyana,Haiti,Honduras,Hungary,Iceland,India,Indonesia,Iran,Iraq,Ireland,Israel,Italy,Ivory Coast,Jamaica,Japan,Jordan,Kazakhstan,Kenya,Kiribati,Kuwait,Kyrgyzstan,Laos,Latvia,Lebanon,Lesotho,Liberia,Libya,Liechtenstein,Lithuania,Luxembourg,Madagascar,Malawi,Malaysia,Maldives,Mali,Malta,Marshall Islands,Mauritania,Mauritius,Mexico,Micronesia,Moldova,Monaco,Mongolia,Montenegro,Morocco,Mozambique,Myanmar,Namibia,Nauru,Nepal,Netherlands,New Zealand,Nicaragua,Niger,Nigeria,North Korea,North Macedonia,Norway,Oman,Pakistan,Palau,Panama,Papua New Guinea,Paraguay,Peru,Philippines,Poland,Portugal,Qatar,Romania,Russia,Rwanda,Saint Kitts and Nevis,Saint Lucia,Saint Vincent and the Grenadines,Samoa,San Marino,Sao Tome and Principe,Saudi Arabia,Senegal,Serbia,Seychelles,Sierra Leone,Singapore,Slovakia,Slovenia,Solomon Islands,Somalia,South Africa,South Korea,South Sudan,Spain,Sri Lanka,Sudan,Suriname,Sweden,Switzerland,Syria,Tajikistan,Tanzania,Thailand,Timor-Leste,Togo,Tonga,Trinidad and Tobago,Tunisia,Turkey,Turkmenistan,Tuvalu,Uganda,Ukraine,United Arab Emirates,United Kingdom,United States,Uruguay,Uzbekistan,Vanuatu,Vatican City,Venezuela,Vietnam,Yemen,Zambia,Zimbabwe';
        $states = 'Alabama,Alaska,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming';
        $nba = 'Atlanta Hawks,Boston Celtics,Brooklyn Nets,Charlotte Hornets,Chicago Bulls,Cleveland Cavaliers,Dallas Mavericks,Denver Nuggets,Detroit Pistons,Golden State Warriors,Houston Rockets,Indiana Pacers,LA Clippers,Los Angeles Lakers,Memphis Grizzlies,Miami Heat,Milwaukee Bucks,Minnesota Timberwolves,New Orleans Pelicans,New York Knicks,Oklahoma City Thunder,Orlando Magic,Philadelphia 76ers,Phoenix Suns,Portland Trail Blazers,Sacramento Kings,San Antonio Spurs,Toronto Raptors,Utah Jazz,Washington Wizards';
        $nfl = 'Arizona Cardinals,Atlanta Falcons,Baltimore Ravens,Buffalo Bills,Carolina Panthers,Chicago Bears,Cincinnati Bengals,Cleveland Browns,Dallas Cowboys,Denver Broncos,Detroit Lions,Green Bay Packers,Houston Texans,Indianapolis Colts,Jacksonville Jaguars,Kansas City Chiefs,Las Vegas Raiders,Los Angeles Chargers,Los Angeles Rams,Miami Dolphins,Minnesota Vikings,New England Patriots,New Orleans Saints,New York Giants,New York Jets,Philadelphia Eagles,Pittsburgh Steelers,San Francisco 49ers,Seattle Seahawks,Tampa Bay Buccaneers,Tennessee Titans,Washington Commanders';
        $mlb = 'Arizona Diamondbacks,Atlanta Braves,Baltimore Orioles,Boston Red Sox,Chicago Cubs,Chicago White Sox,Cincinnati Reds,Cleveland Guardians,Colorado Rockies,Detroit Tigers,Houston Astros,Kansas City Royals,Los Angeles Angels,Los Angeles Dodgers,Miami Marlins,Milwaukee Brewers,Minnesota Twins,New York Mets,New York Yankees,Athletics,Philadelphia Phillies,Pittsburgh Pirates,San Diego Padres,San Francisco Giants,Seattle Mariners,St. Louis Cardinals,Tampa Bay Rays,Texas Rangers,Toronto Blue Jays,Washington Nationals';
        $food = 'Pizza,Biryani,Burger,Sushi,Tacos,Pasta,Dosa,Fried Rice,Noodles,Salad,Sandwich,Butter Chicken,Paneer Tikka,Shawarma,Ramen,Pav Bhaji,Momos,Thali,Grilled Chicken,Soup';
        $colors = ['Red' => '#e53935', 'Orange' => '#fb8c00', 'Yellow' => '#fdd835', 'Green' => '#43a047', 'Blue' => '#1e88e5', 'Indigo' => '#3949ab', 'Violet' => '#8e24aa', 'Pink' => '#ec407a', 'Brown' => '#6d4c41', 'Black' => '#212121', 'White' => '#fafafa', 'Grey' => '#9e9e9e', 'Teal' => '#00897b', 'Cyan' => '#00acc1', 'Gold' => '#ffb300', 'Maroon' => '#880e4f'];

        $tools = [
            ['yes-no-wheel', 'Yes or No Wheel', '✅', 'Can\'t decide? Spin the yes or no wheel for an instant, unbiased answer.',
                ['Yes', 'No'], ['colors' => [['color' => '#43a047', 'enabled' => true], ['color' => '#e53935', 'enabled' => true]], 'spinTime' => 5]],
            ['yes-no-maybe-wheel', 'Yes No Maybe Wheel', '🤔', 'Add a little suspense: yes, no or maybe - let the wheel decide.',
                ['Yes', 'No', 'Maybe'], ['colors' => [['color' => '#43a047', 'enabled' => true], ['color' => '#e53935', 'enabled' => true], ['color' => '#fdd835', 'enabled' => true]], 'spinTime' => 5]],
            ['number-picker', 'Random Number Picker', '🔢', 'Spin to pick a random number between 1 and 10. Edit the list to change the range.',
                array_map('strval', range(1, 10)), []],
            ['number-picker-1-100', 'Random Number 1-100', '💯', 'Pick a random whole number from 1 to 100 with one spin.',
                array_map('strval', range(1, 100)), []],
            ['letter-picker', 'Random Letter Picker', '🔤', 'Spin the alphabet wheel to pick a random letter from A to Z - great for word games and classroom activities.',
                range('A', 'Z'), []],
            ['color-picker', 'Random Color Picker', '🎨', 'Spin to choose a random colour. Every slice is painted in the colour it names.',
                array_map(fn ($n, $c) => ['text' => $n, 'color' => $c], array_keys($colors), $colors), ['spinTime' => 6]],
            ['country-picker', 'Random Country Picker', '🌍', 'Spin the wheel to pick a random country from every nation in the world - perfect for travel ideas and geography quizzes.',
                explode(',', $countries), []],
            ['state-picker', 'Random US State Picker', '🗺️', 'Pick one of the 50 US states at random.',
                explode(',', $states), []],
            ['day-picker', 'Random Day Picker', '📅', 'Let the wheel choose a day of the week.',
                ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []],
            ['what-to-eat-wheel', 'What Should I Eat Wheel', '🍕', 'Hungry and undecided? Spin the food wheel to pick what to eat today.',
                explode(',', $food), []],
            ['truth-or-dare-wheel', 'Truth or Dare Wheel', '🎲', 'Spin to decide: truth or dare? A fun party game picker.',
                ['Truth', 'Dare', 'Truth', 'Dare'], ['colors' => [['color' => '#1e88e5', 'enabled' => true], ['color' => '#e53935', 'enabled' => true]]]],
            ['nba-team-picker', 'NBA Team Picker', '🏀', 'Pick a random NBA team for drafts, fantasy leagues or video game matches.',
                explode(',', $nba), []],
            ['nfl-team-picker', 'NFL Team Picker', '🏈', 'Spin to pick a random NFL team.',
                explode(',', $nfl), []],
            ['mlb-team-picker', 'MLB Team Picker', '⚾', 'Choose a random MLB team with one spin.',
                explode(',', $mlb), []],
            ['coin-flip-wheel', 'Heads or Tails', '🪙', 'A fair coin toss on a wheel: heads or tails.',
                ['Heads', 'Tails'], ['colors' => [['color' => '#ffb300', 'enabled' => true], ['color' => '#90a4ae', 'enabled' => true]], 'spinTime' => 4]],
            ['dice-roller-wheel', 'Dice Roller Wheel', '🎯', 'Roll a virtual six-sided die using the wheel.',
                ['1', '2', '3', '4', '5', '6'], ['spinTime' => 4]],
        ];

        // Rewritten page content lives in database/seeders/content/*.php
        $pages = array_merge(require __DIR__.'/content/tools_a.php', require __DIR__.'/content/tools_b.php');

        $v2 = require __DIR__.'/content/presets_v2.php';

        foreach ($tools as $i => [$slug, $name, $emoji, $intro, $entries, $settings]) {
            if (isset($v2[$slug])) {
                $entries = $v2[$slug]['entries'];
                $settings = array_merge($settings, $v2[$slug]['settings']);
            }
            $config = WheelConfig::sanitize([
                'title' => $name,
                'entries' => array_map(fn ($e) => is_array($e) ? $e : ['text' => $e], $entries),
                'settings' => $settings + ['showTitle' => true],
            ]);
            $page = $pages[$slug] ?? [];
            ToolPreset::updateOrCreate(['slug' => $slug], [
                'name' => $name,
                'heading' => $page['heading'] ?? $name,
                'emoji' => $emoji,
                'meta_title' => $page['meta_title'] ?? "{$name} – Spin Online Free | PickerPlay",
                'meta_description' => $page['meta_description'] ?? mb_substr($intro, 0, 155),
                'config' => $config,
                'content' => $page['content'] ?? $this->content($name, $intro, count($entries)),
                'is_active' => true,
                'show_in_menu' => true,
                'sort_order' => ($i + 1) * 10,
            ]);
        }
    }

    private function content(string $name, string $intro, int $count): string
    {
        $lower = mb_strtolower($name);

        return <<<HTML
<h2>About the {$name}</h2>
<p>{$intro}</p>
<p>The wheel starts with {$count} options. You can edit, add or remove entries in the box beside the wheel, change the colours and sounds in <strong>Customize</strong>, and share your version with a link.</p>
<h2>How to use the {$lower}</h2>
<ol>
<li>Check the entries on the right - edit them if you like.</li>
<li>Click the wheel or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to spin.</li>
<li>The pointer shows the result. Remove it or spin again.</li>
</ol>
<h2>Is it fair?</h2>
<p>Every spin uses your browser's cryptographically secure random generator, so each option has exactly the chance its slice size shows.</p>
HTML;
    }
}

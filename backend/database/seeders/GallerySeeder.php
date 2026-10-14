<?php

namespace Database\Seeders;

use App\Models\Wheel;
use Illuminate\Database\Seeder;

/** A few public wheels so the gallery is not empty on day one. */
class GallerySeeder extends Seeder
{
    public function run(): void
    {
        $samples = [
            ['Rainbow Colors', ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet']],
            ['Dinner Ideas', ['Pizza', 'Biryani', 'Tacos', 'Sushi', 'Pasta', 'Dosa', 'Burger', 'Noodles']],
            ['Classroom Jobs', ['Line leader', 'Door holder', 'Board cleaner', 'Plant waterer', 'Paper passer', 'Librarian']],
            ['Weekend Activity', ['Movie night', 'Hike', 'Board games', 'Cook together', 'Visit a museum', 'Picnic']],
            ['Team Names', ['Thunder', 'Falcons', 'Rockets', 'Tigers', 'Sharks', 'Wolves']],
            ['Workout Of The Day', ['Push-ups', 'Squats', 'Plank', 'Burpees', 'Lunges', 'Jumping jacks', 'Rest day']],
        ];
        foreach ($samples as $i => [$title, $entries]) {
            if (Wheel::where('kind', 'shared')->where('title', $title)->exists()) {
                continue;
            }
            $w = new Wheel([
                'kind' => 'shared',
                'share_code' => Wheel::generateShareCode(),
                'title' => $title,
                'visibility' => 'public',
                'is_featured' => $i < 3,
                'views' => 0,
                'last_viewed_at' => now(),
            ]);
            $w->fillConfig(['title' => $title, 'entries' => $entries, 'settings' => []])->save();
        }
    }
}

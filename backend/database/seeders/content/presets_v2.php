<?php

/*
 * Client change round (Oct 2026): updated wheel presets.
 * Shared by ToolPresetSeeder (fresh installs) and the 2026_10_14 data migration (live site).
 * Each value: ['entries' => [...], 'settings' => [...] ] merged into the preset's config.
 */

$truths = [
    'What is the most embarrassing thing that has happened to you at school or work?',
    'What is one secret talent nobody here knows about?',
    'Who was your first crush?',
    'What is the silliest thing you are afraid of?',
    'What is the last lie you told?',
    'Which person in this room would you swap lives with for a day, and why?',
    'What is the weirdest food you have ever eaten?',
    'What is the most childish thing you still do?',
    'Have you ever pretended to be sick to skip something? What was it?',
    'What is the worst gift you have ever received?',
    'What song do you secretly love but would never admit in public?',
    'What is the longest you have gone without showering?',
    'What was your most awkward moment on a video call?',
    'If you could be invisible for a day, what would you do first?',
    'What is the most trouble you got into as a kid?',
    'What is something you have never told your parents?',
    'Who in this group do you think would survive longest on a desert island?',
    'What is your biggest pet peeve?',
    'What is the strangest dream you can remember?',
    'Have you ever laughed at a completely wrong moment? What happened?',
    'What is the most money you have spent on something useless?',
    'Which app do you spend way too much time on?',
    'What is one habit you would like to quit?',
    'What is the nicest thing someone has done for you that they do not know about?',
    'What is your guilty-pleasure TV show?',
];

$dares = [
    'Do your best impression of someone in the room until somebody guesses who it is.',
    'Talk in an accent of the group’s choice for the next three rounds.',
    'Do 15 jumping jacks right now.',
    'Sing the chorus of the last song you listened to.',
    'Let the person on your left send one emoji to anyone in your contacts.',
    'Dance with no music for 30 seconds.',
    'Speak only in questions until your next turn.',
    'Do your best runway walk across the room.',
    'Hold a plank for 30 seconds.',
    'Tell a joke – if nobody laughs, do another dare.',
    'Balance a book (or phone) on your head for one minute.',
    'Show the most recent photo in your camera roll.',
    'Let the group choose a new nickname for you for the rest of the game.',
    'Act like a chicken until your next turn.',
    'Say the alphabet backwards as fast as you can.',
    'Do your best celebrity impression.',
    'Try to lick your elbow.',
    'Pretend to be a news reporter and describe what is happening in the room.',
    'Keep a straight face for one minute while everyone tries to make you laugh.',
    'Draw a portrait of the person on your right with your eyes closed.',
    'Do a dramatic reading of the last text message you received.',
    'Talk like a robot until your next turn.',
    'Make up a 4-line rap about the person opposite you.',
    'Do 10 squats while singing “Happy Birthday”.',
    'Wear your shirt or jacket backwards for the next three rounds.',
];

$repeat = fn (array $pair, int $times) => array_merge(...array_fill(0, $times, $pair));
$sports = json_decode(file_get_contents(__DIR__.'/sports.json'), true);

return [
    'truth-or-dare-wheel' => [
        'entries' => $repeat([
            ['text' => 'Truth', 'message' => implode("\n", $truths)],
            ['text' => 'Dare', 'message' => implode("\n", $dares)],
        ], 5),
        'settings' => [
            'colors' => [['color' => '#31c0ff', 'enabled' => true], ['color' => '#ff3269', 'enabled' => true]],
            'popupMessage' => 'Your challenge is…',
            'showRemove' => false,
            'boldText' => true,
            'textScale' => 1.2,
            'spinTime' => 6,
        ],
    ],
    'coin-flip-wheel' => [
        'entries' => $repeat([['text' => 'Heads'], ['text' => 'Tails']], 5),
        'settings' => [
            'colors' => [['color' => '#fee20a', 'enabled' => true], ['color' => '#90a4ae', 'enabled' => true]],
            'showRemove' => false,
            'boldText' => true,
            'textScale' => 1.2,
            'spinTime' => 4,
        ],
    ],
    'dice-roller-wheel' => [
        'entries' => array_map(fn ($n) => ['text' => (string) $n], range(1, 6)),
        'settings' => [
            'colors' => [
                ['color' => '#9cd60c', 'enabled' => true], ['color' => '#ff3269', 'enabled' => true], ['color' => '#fee20a', 'enabled' => true],
                ['color' => '#7c5afe', 'enabled' => true], ['color' => '#31c0ff', 'enabled' => true], ['color' => '#fb8c00', 'enabled' => true],
            ],
            'showRemove' => false,
            'boldText' => true,
            'textScale' => 2.6,
            'spinTime' => 4,
        ],
    ],
    'nba-team-picker' => ['entries' => $sports['nba-team-picker'], 'settings' => ['contours' => true]],
    'nfl-team-picker' => ['entries' => $sports['nfl-team-picker'], 'settings' => ['contours' => true]],
    'mlb-team-picker' => ['entries' => $sports['mlb-team-picker'], 'settings' => ['contours' => true]],
];

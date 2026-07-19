<?php
require_once __DIR__ . '/../config/database.php';

$entries = loadEntries();

// Calculate streak
function calcStreak($entries) {
    if (empty($entries)) return 0;
    $dates = array_column($entries, 'date');
    $streak = 0;
    $date = new DateTime();
    while (in_array($date->format('Y-m-d'), $dates)) {
        $streak++;
        $date->modify('-1 day');
    }
    return $streak;
}

// Calculate mood averages
$totalMood = 0;
$moodCount = 0;
foreach ($entries as $entry) {
    if (isset($entry['moodVal'])) {
        $totalMood += $entry['moodVal'];
        $moodCount++;
    }
}
$avgMood = $moodCount > 0 ? round($totalMood / $moodCount, 1) : 0;

// Get last 7 days
$last7 = [];
for ($i = 6; $i >= 0; $i--) {
    $date = (new DateTime())->modify("-$i days")->format('Y-m-d');
    $entry = array_values(array_filter($entries, function($e) use ($date) {
        return $e['date'] === $date;
    }));
    $last7[] = [
        'date' => $date,
        'entry' => $entry[0] ?? null
    ];
}

sendResponse(true, [
    'total' => count($entries),
    'avgMood' => $avgMood,
    'streak' => calcStreak($entries),
    'last7' => $last7
]);
?>
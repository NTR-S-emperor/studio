<?php
// stories.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Stories folder (relative to this file)
$storiesDir = __DIR__ . '/stories';

// If folder doesn't exist: return empty array
if (!is_dir($storiesDir)) {
    echo json_encode([]);
    exit;
}

$stories = [];

// Loop through subfolders in /stories
foreach (scandir($storiesDir) as $entry) {
    if ($entry === '.' || $entry === '..') continue;

    $fullPath = $storiesDir . '/' . $entry;
    if (!is_dir($fullPath)) continue;

    // Handle prefix like "1-Story 1"
    $order = 9999;
    $title = $entry;

    if (strpos($entry, '-') !== false) {
        list($orderStr, $rest) = explode('-', $entry, 2);
        $order = intval($orderStr);
        $title = $rest;
    }

    // Description
    $descFile = $fullPath . '/desc.txt';
    $desc = file_exists($descFile) ? trim(file_get_contents($descFile)) : '';

    // Icon (web path)
    $iconWebPath = 'stories/' . $entry . '/icon.png';

    $stories[] = [
        'id'          => $entry,      // raw folder identifier
        'title'       => $title,      // "Story 1"
        'order'       => $order,      // 1, 2, 3...
        'description' => $desc,
        'icon'        => $iconWebPath
    ];
}

// Sort by "order" field
usort($stories, function ($a, $b) {
    return $a['order'] <=> $b['order'];
});

echo json_encode($stories, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

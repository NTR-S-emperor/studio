<?php
// music.php - List available music tracks

header('Content-Type: application/json');

$musicDir = __DIR__ . '/assets/music';
$musicPath = 'assets/music';

// Supported audio extensions
$validExtensions = ['mp3', 'ogg', 'wav', 'm4a', 'aac'];

$tracks = [];

if (is_dir($musicDir)) {
    $files = scandir($musicDir);

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;

        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($ext, $validExtensions)) continue;

        $tracks[] = $musicPath . '/' . $file;
    }
}

echo json_encode($tracks);

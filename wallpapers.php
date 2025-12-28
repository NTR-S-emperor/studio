<?php
// wallpapers.php - List available wallpapers

header('Content-Type: application/json');

$wallpapersDir = __DIR__ . '/assets/wallpapers';
$wallpapersPath = 'assets/wallpapers';

// Supported image extensions
$validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

$wallpapers = [];
$defaultWallpaper = null;

if (is_dir($wallpapersDir)) {
    $files = scandir($wallpapersDir);

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;

        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($ext, $validExtensions)) continue;

        $name = pathinfo($file, PATHINFO_FILENAME);
        $src = $wallpapersPath . '/' . $file;

        // Check if this is the default wallpaper (name = "1")
        if ($name === '1') {
            $defaultWallpaper = $src;
        }

        $wallpapers[] = [
            'name' => $name,
            'src' => $src
        ];
    }

    // Sort by name
    usort($wallpapers, function($a, $b) {
        return strnatcasecmp($a['name'], $b['name']);
    });
}

echo json_encode([
    'wallpapers' => $wallpapers,
    'default' => $defaultWallpaper
]);

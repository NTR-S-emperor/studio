<?php
/**
 * Documentation Server
 * Forces complete reload every time - bypasses ALL caching mechanisms
 */

// Aggressive no-cache headers for every possible cache system
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
header('CDN-Cache-Control: no-store');
header('Cloudflare-CDN-Cache-Control: no-store');
header('Surrogate-Control: no-store');
header('X-Accel-Expires: 0');
header('Vary: *');

// Prevent PHP caching
clearstatcache(true);
if (function_exists('opcache_reset')) {
    opcache_reset();
}

// Generate unique cache buster for this request
$cacheBuster = substr(md5(microtime(true) . mt_rand()), 0, 12);

// Get requested page from query string
$page = isset($_GET['p']) ? $_GET['p'] : 'index';

// Sanitize: only allow alphanumeric, dash, underscore
$page = preg_replace('/[^a-zA-Z0-9_-]/', '', $page);

// Build file path
$file = __DIR__ . '/' . $page . '.html';

// Check if file exists
if (!file_exists($file)) {
    http_response_code(404);
    echo '<!DOCTYPE html><html><head><title>404</title></head><body><h1>Page not found</h1></body></html>';
    exit;
}

// Read the HTML content
$html = file_get_contents($file);

// Inject cache buster into all CSS and JS references
$html = preg_replace_callback(
    '/(<(?:link|script)[^>]*(?:href|src)=["\'])([^"\']+\.(css|js))(["\'][^>]*>)/i',
    function($matches) use ($cacheBuster) {
        $before = $matches[1];
        $url = $matches[2];
        $after = $matches[4];

        // Add or replace query parameter
        if (strpos($url, '?') !== false) {
            $url = preg_replace('/\?.*$/', '', $url);
        }
        $url .= '?_=' . $cacheBuster;

        return $before . $url . $after;
    },
    $html
);

// Also inject a meta tag to prevent browser caching
$metaTags = '
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
';

$html = preg_replace('/<head>/i', '<head>' . $metaTags, $html, 1);

// Output
header('Content-Type: text/html; charset=utf-8');
echo $html;

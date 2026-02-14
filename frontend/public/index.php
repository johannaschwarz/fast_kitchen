<?php
/**
 * Pre-rendering entry point for FastKitchen.
 */

const API_BASE = 'https://api.flottekueche.de/';

$html = file_get_contents(__DIR__ . '/index.html');

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Check if this is a recipe page: /recipe/{id}
if (preg_match('/^\/recipe\/(\d+)$/', $path, $matches)) {
    $recipe_id = $matches[1];

    // Fetch recipe data from API
    $context = stream_context_create([
        'http' => ['timeout' => 3]
    ]);
    $response = @file_get_contents(API_BASE . 'recipe/specific/' . $recipe_id, false, $context);

    if ($response !== false) {
        $recipe = json_decode($response, true);

        if (isset($recipe['title'])) {
            $title = htmlspecialchars($recipe['title'], ENT_QUOTES, 'UTF-8') . ' - FlotteKüche';
            $description = htmlspecialchars($recipe['description'] ?? '', ENT_QUOTES, 'UTF-8');

            // Replace default OG tags with recipe-specific ones
            $html = preg_replace(
                '/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/',
                '<meta property="og:title" content="' . $title . '" />',
                $html
            );
            $html = preg_replace(
                '/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/',
                '<meta property="og:description" content="' . $description . '" />',
                $html
            );
            $html = preg_replace(
                '/<title>[^<]*<\/title>/',
                '<title>' . $title . '</title>',
                $html
            );

            // Add image tag if cover image exists
            if (!empty($recipe['cover_image'])) {
                $image_url = API_BASE . 'image/' . $recipe['cover_image'];
                $html = str_replace(
                    '<!-- OG_META -->',
                    '<meta property="og:image" content="' . htmlspecialchars($image_url, ENT_QUOTES, 'UTF-8') . '" />' . "\n    " . '<!-- OG_META -->',
                    $html
                );
            }
        }
    }
}

echo $html;

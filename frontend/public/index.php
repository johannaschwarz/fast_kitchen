<!DOCTYPE html>
<html lang="en">
<?php
const API_BASE = 'https://api.flottekueche.de/';

$title = "FastKitchen";

// get request uri
$request_uri = $_SERVER['REQUEST_URI'];

// check if request uri is empty
if (!empty($request_uri)) {
  $path = parse_url($uri, PHP_URL_PATH);
  preg_match('/\/recipe\/[0-9]+/', $path, $matches);
  if (!is_null($matches)) {
    $recipe_id = str_replace('/recipe/', '', $path);

    // call api
    $response = file_get_contents(API_BASE . 'recipe/specific/' . $recipe_id);
    $recipe = json_decode($response, true);

    if (isset($recipe['name'])) {
      $title = $recipe['name'] . ' - FastKitchen';
      $description = $recipe['description'];
      if (isset($recipe['cover_image']) && !is_null($recipe['cover_image'])) {
        $image_url = API_BASE . "image/" . $recipe['cover_image'];
      }
    }
  }
}

?>

<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
  <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
  <title><?= $title ?></title>
  <meta name="type" property="og:type" content="website" />
  <?php
  if (isset($description)) {
    echo '<meta name="title" property="og:title" content="' . $title . '"/>';
    echo '<meta name="description" property="og:description" content="' . $description . '"/>';
  }
  if (isset($image_url)) {
    echo '<meta name="image" property="og:image" content="' . $image_url . '"/>';
  }
  ?>
</head>

<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>

</html>
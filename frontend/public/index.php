<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

const API_BASE = 'https://api.flottekueche.de/';

$title = "FastKitchen";

// get request uri
$request_uri = $_SERVER['REQUEST_URI'];

// check if request uri is empty
if (!empty($request_uri)) {
  $path = parse_url($request_uri, PHP_URL_PATH);
  preg_match('/\/recipe\/[0-9]+/', $path, $matches);
  if (count($matches) > 0) {
    $recipe_id = str_replace('/recipe/', '', $path);

    // call api
    $response = file_get_contents(API_BASE . 'recipe/specific/' . $recipe_id);
    $recipe = json_decode($response, true);
    if (isset($recipe['title'])) {
      $title = $recipe['title'] . ' - FastKitchen';
      $description = $recipe['description'];
      if (isset($recipe['cover_image']) && !is_null($recipe['cover_image'])) {
        $image_url = API_BASE . "image/" . $recipe['cover_image'];
      }
    }
  }
}

require_once($_SERVER['DOCUMENT_ROOT'] . '/html_doc.html');

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRecipeListParams, recipeCategories } from './recipeListParams.js';

test('invalid URL values fall back to a usable recipe list', () => {
  assert.deepEqual(parseRecipeListParams(new URLSearchParams(
    'categories=Unknown&categories=&sort_by=invalid&sort_order=invalid',
  )), { filters: [], search: '', sortByOption: 'Clicks', sortOrder: 'DESC' });
});

test('valid selections and search survive URL serialization', () => {
  for (const sortBy of ['Clicks', 'RecipeID', 'Title', 'CookingTime']) {
    for (const sortOrder of ['ASC', 'DESC']) {
      const params = new URLSearchParams({ search: 'Brot & Gemüse', sort_by: sortBy, sort_order: sortOrder });
      recipeCategories.forEach((category) => params.append('categories', category));
      assert.deepEqual(parseRecipeListParams(new URLSearchParams(params.toString())), {
        filters: recipeCategories, search: 'Brot & Gemüse', sortByOption: sortBy, sortOrder,
      });
    }
  }
});

test('mixed categories retain valid filters and discard duplicates', () => {
  const params = new URLSearchParams('categories=Vegan&categories=Unknown&categories=Vegan&categories=Brot');
  assert.deepEqual(parseRecipeListParams(params).filters, ['Vegan', 'Brot']);
});

test('missing parameters use the default list selections', () => {
  assert.deepEqual(parseRecipeListParams(new URLSearchParams()), {
    filters: [], search: '', sortByOption: 'Clicks', sortOrder: 'DESC',
  });
});

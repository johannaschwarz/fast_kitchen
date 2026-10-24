// Keep these values aligned with CategoryEnum and the sorting enums in the backend.
export const recipeCategories = [
  'Hauptgericht', 'Beilage', 'Brot', 'Sauce', 'Vegetarisch',
  'Vegan', 'Getränk', 'Gebäck', 'Asia',
];
const sortFields = ['Clicks', 'RecipeID', 'Title', 'CookingTime'];
const sortOrders = ['ASC', 'DESC'];

export function parseRecipeListParams(params) {
  const sortBy = params.get('sort_by');
  const order = params.get('sort_order');
  return {
    filters: [...new Set(params.getAll('categories'))]
      .filter((category) => recipeCategories.includes(category)),
    search: params.get('search') || '',
    sortByOption: sortFields.includes(sortBy) ? sortBy : 'Clicks',
    sortOrder: sortOrders.includes(order) ? order : 'DESC',
  };
}

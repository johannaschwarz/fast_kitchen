-- name: GetRecipe :one
SELECT r.RecipeID, r.Title, r.Description, r.CookingTime, r.CoverImage, r.Portions, u.Username, u.UserID, r.Clicks FROM Recipes r, Users u WHERE r.RecipeID = ? AND r.UserID = u.UserID LIMIT 1;

-- name: UpdateClicks :exec
UPDATE Recipes SET Clicks = Clicks + 1 WHERE RecipeID = ?;

-- name: GetCategoriesByRecipe :many
SELECT Category FROM Categories WHERE RecipeID = ?;

-- name: GetIngredientsByRecipe :many
SELECT Ingredient, Unit, Amount, IngredientGroup FROM Ingredients WHERE RecipeID = ?;

-- name: GetGalleryImagesByRecipe :many
SELECT i.ImageID FROM Images i, Recipes r WHERE i.RecipeID = ? AND r.RecipeID = i.RecipeID AND i.StepID IS NULL AND i.ImageID != r.CoverImage;

-- name: GetRecipeStepsByRecipe :many
SELECT StepID, OrderID, Step FROM RecipeSteps WHERE RecipeID = ?;

-- name: GetImagesByRecipeStep :many
SELECT ImageID FROM Images WHERE StepID = ?;
package ports

import (
	"context"

	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/data"
)

type RecipeService interface {
	GetRecipe(ctx context.Context, recipeID int) (*data.Recipe, error)
}

package ports

import (
	"context"

	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/data"
)

type RecipeRepository interface {
	GetRecipe(ctx context.Context, recipeid int) (*data.Recipe, error)
}

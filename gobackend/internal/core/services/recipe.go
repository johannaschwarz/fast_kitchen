package services

import (
	"context"

	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/data"
	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/driven/ports"
)

type RecipeService struct {
	repo ports.RecipeRepository
}

func NewRecipeService(repo ports.RecipeRepository) *RecipeService {
	return &RecipeService{repo: repo}
}

func (s *RecipeService) GetRecipe(ctx context.Context, recipeID int) (*data.Recipe, error) {
	return s.repo.GetRecipe(ctx, recipeID)
}

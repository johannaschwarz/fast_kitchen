package database

import (
	"context"
	"database/sql"

	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/data"
)

type Database struct {
	db      *sql.DB
	queries *Queries
}

func NewDatabase(db *sql.DB) *Database {
	queries := New(db)
	return &Database{db: db, queries: queries}
}

func (db *Database) GetRecipe(ctx context.Context, recipeid int) (*data.Recipe, error) {
	recipe, err := db.queries.GetRecipe(ctx, recipeid)
	if err != nil {
		return nil, err
	}

	recipeData := data.Recipe{
		ID:    recipe.Recipeid,
		Title: recipe.Title,
	}

	//TODO: fill recipe with all data

	return &recipeData, nil
}

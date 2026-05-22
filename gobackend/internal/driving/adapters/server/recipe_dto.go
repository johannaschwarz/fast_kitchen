package server

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/data"
)

// --- GetRecipe ---

type GetRecipeRequest struct {
	ID int `json:"id"`
}

type GetRecipeResponse struct {
	data.Recipe
}

func decodeGetRecipeRequest(r *http.Request) (*GetRecipeRequest, error) {
	pathSplit := strings.Split(r.URL.Path, "/")
	if len(pathSplit) < 4 {
		return nil, errors.New("invalid path: " + r.URL.Path)
	}
	id, err := strconv.Atoi(pathSplit[3])
	if err != nil {
		return nil, err
	}
	return &GetRecipeRequest{ID: id}, nil
}

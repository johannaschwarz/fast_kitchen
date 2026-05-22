package server

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/data"
	drivingports "github.com/johannaschwarz/fast_kitchen/gobackend/internal/driving/ports"
)

type RecipeHandler struct {
	log     *slog.Logger
	service drivingports.RecipeService
}

type GetRecipeRequest struct {
	ID int `json:"id"`
}

func (h RecipeHandler) decode(req *http.Request) (*GetRecipeRequest, error) {
	pathSplit := strings.Split(req.URL.Path, "/")
	if len(pathSplit) < 4 {
		return nil, errors.New("invalid path: " + req.URL.Path)
	}
	id, err := strconv.Atoi(pathSplit[3])
	if err != nil {
		return nil, err
	}
	return &GetRecipeRequest{ID: id}, nil
}

type GetRecipeResponse struct {
	data.Recipe
}

func NewRecipeHandler(log *slog.Logger, service drivingports.RecipeService) *RecipeHandler {
	return &RecipeHandler{log: log, service: service}
}

func (h *RecipeHandler) HandleGetRecipe(s *Server) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		req, err := h.decode(r)
		if err != nil {
			h.log.ErrorContext(r.Context(), "failed to decode get recipe request", "error", err)
			s.respond(w, nil, http.StatusBadRequest)
			return
		}

		recipe, err := h.service.GetRecipe(r.Context(), req.ID)
		if err != nil {
			h.log.ErrorContext(r.Context(), "failed getting recipe", "id", req.ID, "error", err)
			s.respond(w, nil, http.StatusInternalServerError)
			return
		}

		res := GetRecipeResponse{
			Recipe: *recipe,
		}

		s.respond(w, res, http.StatusOK)
	}
}

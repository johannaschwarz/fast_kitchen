package server

import (
	"log/slog"
	"net/http"

	drivingports "github.com/johannaschwarz/fast_kitchen/gobackend/internal/driving/ports"
)

type RecipeHandler struct {
	log     *slog.Logger
	service drivingports.RecipeService
}

func NewRecipeHandler(log *slog.Logger, service drivingports.RecipeService) *RecipeHandler {
	return &RecipeHandler{log: log, service: service}
}

func (h *RecipeHandler) HandleGetRecipe(s *Server) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		req, err := decodeGetRecipeRequest(r)
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


package server

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/config"
	drivingports "github.com/johannaschwarz/fast_kitchen/gobackend/internal/driving/ports"
)

type Server struct {
	ctx           context.Context
	log           *slog.Logger
	cfg           *config.Config
	creds         *config.Creds
	recipeHandler *RecipeHandler
	mux           *http.ServeMux
}

func New(ctx context.Context, log *slog.Logger, cfg *config.Config, creds *config.Creds, recipeService drivingports.RecipeService) http.Handler {
	s := &Server{
		ctx:           ctx,
		mux:           http.NewServeMux(),
		log:           log,
		cfg:           cfg,
		creds:         creds,
		recipeHandler: NewRecipeHandler(log, recipeService),
	}

	s.routes()

	return s.mux
}

func (s *Server) respond(w http.ResponseWriter, data any, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			s.log.Error("failed to encode response", slog.String("error", err.Error()))
		}
	}
}




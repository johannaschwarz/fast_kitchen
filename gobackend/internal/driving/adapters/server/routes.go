package server

func (s *Server) routes() {
	s.mux.HandleFunc("GET /recipe/specific/{id}", s.recipeHandler.HandleGetRecipe(s))
}

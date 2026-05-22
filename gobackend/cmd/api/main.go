package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"time"

	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/config"
	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/core/services"
	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/driven/adapters/database"
	"github.com/johannaschwarz/fast_kitchen/gobackend/internal/driving/adapters/server"

	_ "github.com/go-sql-driver/mysql"
)

func run() error {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	cfg, err := config.LoadConfig(ctx, logger)
	if err != nil {
		return err
	}

	creds, err := config.LoadCreds(ctx, logger)
	if err != nil {
		return err
	}

	//TODO: define connection details
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", creds.DatabaseUser, creds.DatabasePassword, cfg.DatabaseIp, cfg.DatabasePort, creds.DatabaseName)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return err
	}
	defer db.Close()
	if err = db.PingContext(ctx); err != nil {
		logger.Error("database ping failed", slog.String("error", err.Error()))
	}

	dbAdapter := database.NewDatabase(db)
	recipeService := services.NewRecipeService(dbAdapter)
	srv := server.New(ctx, logger, cfg, creds, recipeService)

	httpServer := &http.Server{
		Addr:        ":8080",
		Handler:     srv,
		BaseContext: func(_ net.Listener) context.Context { return ctx },
	}

	go func() {
		logger.Info("starting server", slog.String("address", httpServer.Addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server failed", slog.String("error", err.Error()))
		}
	}()

	var wg sync.WaitGroup
	wg.Go(func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			logger.Error("server shutdown failed", slog.String("error", err.Error()))
		}
	})
	wg.Wait()
	return nil
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %s", err.Error())
		os.Exit(1)
	}
}

package config

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
)

const CONFIG_PATH = "./assets/config.json"
const CREDS_PATH = "./assets/creds.json"

type Creds struct {
	DatabaseName     string `json:"database_name"`
	DatabaseUser     string `json:"database_user"`
	DatabasePassword string `json:"database_password"`
}

type Config struct {
	DatabaseIp   string `json:"database_ip"`
	DatabasePort string `json:"database_port"`
}

func LoadConfig(ctx context.Context, log *slog.Logger) (*Config, error) {
	jsonFile, err := os.Open(CONFIG_PATH)
	if err != nil {
		return nil, err
	}
	defer jsonFile.Close()

	var config Config
	err = json.NewDecoder(jsonFile).Decode(&config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

func LoadCreds(ctx context.Context, log *slog.Logger) (*Creds, error) {
	jsonFile, err := os.Open(CREDS_PATH)
	if err != nil {
		return nil, err
	}
	defer jsonFile.Close()

	var creds Creds
	err = json.NewDecoder(jsonFile).Decode(&creds)
	if err != nil {
		return nil, err
	}

	return &creds, nil
}

package main

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func loadEnvAndConnectPostgres() (*sql.DB, error) {
	err := godotenv.Load(".env")
	if err != nil {
		return nil,fmt.Errorf("⚠️ 無法載入 .env，將使用系統環境變數: %w",err)
	}

	host := os.Getenv("POSTGRES_HOST")
	port := os.Getenv("POSTGRES_PORT")
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbname := os.Getenv("POSTGRES_DB")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("PostgreSQL 連線錯誤: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("PostgreSQL ping 失敗: %w", err)
	}
	return db, nil
}

package db

import (
	"log"
	"os"

	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("error conectando a la base de datos: %v", err)
	}

	if err := db.AutoMigrate(&model.User{}, &model.Category{}, &model.Transaction{}); err != nil {
		log.Fatalf("error en migración: %v", err)
	}

	return db
}

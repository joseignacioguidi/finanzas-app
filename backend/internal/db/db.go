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
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		log.Fatalf("error conectando a la base de datos: %v", err)
	}

	// AutoMigrate crea columnas/índices nuevos pero no toca lo que ya existe
	models := []any{&model.User{}, &model.Category{}, &model.Transaction{}, &model.RecurringTransaction{}, &model.FinancialGoal{}, &model.Budget{}, &model.Saving{}}
	for _, m := range models {
		if err := db.AutoMigrate(m); err != nil {
			log.Printf("advertencia en migración (%T): %v", m, err)
		}
	}

	// Migración de datos: exchange_rate=1 y base_amount=amount para transacciones pre-existentes
	if err := db.Exec(`UPDATE transactions SET exchange_rate = 1, base_amount = amount WHERE base_amount = 0 AND amount > 0`).Error; err != nil {
		log.Printf("advertencia en migración de datos: %v", err)
	}

	return db
}

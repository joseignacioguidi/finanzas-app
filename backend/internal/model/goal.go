package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FinancialGoal struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID       uuid.UUID `gorm:"type:uuid;not null"   json:"user_id"`
	Name         string    `gorm:"size:100;not null"    json:"name"`
	TargetAmount float64   `gorm:"not null"             json:"target_amount"`
	TargetDate   Date      `gorm:"not null"             json:"target_date"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (g *FinancialGoal) BeforeCreate(tx *gorm.DB) error {
	g.ID = uuid.New()
	return nil
}

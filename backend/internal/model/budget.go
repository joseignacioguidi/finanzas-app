package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Budget struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"                              json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_budget_unique"  json:"user_id"`
	CategoryID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_budget_unique"  json:"category_id"`
	Amount     float64   `gorm:"type:decimal(12,2);not null"                       json:"amount"`
	Month      int       `gorm:"not null;uniqueIndex:idx_budget_unique"            json:"month"`
	Year       int       `gorm:"not null;uniqueIndex:idx_budget_unique"            json:"year"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (b *Budget) BeforeCreate(tx *gorm.DB) error {
	b.ID = uuid.New()
	return nil
}

package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Saving struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"        json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null"           json:"user_id"`
	Name        string    `gorm:"size:255;not null"            json:"name"`
	Type        string    `gorm:"size:50;not null"             json:"type"`
	Amount      float64   `gorm:"type:decimal(12,2);not null"  json:"amount"`
	Currency    string    `gorm:"size:3;not null"              json:"currency"`
	Description string    `gorm:"size:500"                     json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (s *Saving) BeforeCreate(tx *gorm.DB) error {
	s.ID = uuid.New()
	return nil
}

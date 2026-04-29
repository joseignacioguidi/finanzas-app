package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RecurringTransaction struct {
	ID          uuid.UUID       `gorm:"type:uuid;primaryKey"  json:"id"`
	UserID      uuid.UUID       `gorm:"type:uuid;not null"    json:"user_id"`
	CategoryID  uuid.UUID       `gorm:"type:uuid;not null"    json:"category_id"`
	Type        TransactionType `gorm:"not null"              json:"type"`
	Amount      float64         `gorm:"not null"              json:"amount"`
	Currency    string          `gorm:"size:3;not null"       json:"currency"`
	Description string          `gorm:"size:255"              json:"description"`
	DayOfMonth  int             `gorm:"not null"              json:"day_of_month"`
	Active      bool            `gorm:"not null;default:true" json:"active"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

func (r *RecurringTransaction) BeforeCreate(tx *gorm.DB) error {
	r.ID = uuid.New()
	return nil
}

package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"          json:"id"`
	Email        string    `gorm:"size:255;uniqueIndex;not null"  json:"email"`
	PasswordHash string    `gorm:"not null"                       json:"-"`
	BaseCurrency string    `gorm:"size:3;not null;default:'ARS'"  json:"base_currency"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.ID = uuid.New()
	if u.BaseCurrency == "" {
		u.BaseCurrency = "ARS"
	}
	return nil
}

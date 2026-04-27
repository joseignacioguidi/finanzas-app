package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"          json:"id"`
	Email        string    `gorm:"size:255;uniqueIndex;not null"  json:"email"`
	PasswordHash string    `gorm:"not null"                       json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

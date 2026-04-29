package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Category struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"   json:"user_id"`
	Name      string    `gorm:"size:100;not null"    json:"name"`
	Color     string    `gorm:"size:7;not null"      json:"color"`
	Icon      string    `gorm:"size:50"              json:"icon"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	c.ID = uuid.New()
	return nil
}

package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CategoryType string

const (
	CategoryTypeIncome     CategoryType = "income"
	CategoryTypeExpense    CategoryType = "expense"
	CategoryTypeSavings    CategoryType = "savings"
	CategoryTypeInvestment CategoryType = "investment"
)

type Category struct {
	ID            uuid.UUID    `gorm:"type:uuid;primaryKey"              json:"id"`
	UserID        uuid.UUID    `gorm:"type:uuid;not null"                json:"user_id"`
	Name          string       `gorm:"size:100;not null"                 json:"name"`
	Color         string       `gorm:"size:7;not null"                   json:"color"`
	Icon          string       `gorm:"size:50"                           json:"icon"`
	Type          CategoryType `gorm:"size:20;not null;default:'expense'" json:"type"`
	TypeChangedAt *time.Time   `json:"type_changed_at"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	c.ID = uuid.New()
	return nil
}

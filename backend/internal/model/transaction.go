package model

import (
	"time"

	"github.com/google/uuid"
)

type TransactionType string

const (
	TransactionTypeIncome  TransactionType = "income"
	TransactionTypeExpense TransactionType = "expense"
)

type Transaction struct {
	ID          uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      uuid.UUID       `gorm:"type:uuid;not null"   json:"user_id"`
	CategoryID  uuid.UUID       `gorm:"type:uuid;not null"   json:"category_id"`
	Type        TransactionType `gorm:"not null"             json:"type"`
	Amount      float64         `gorm:"not null"             json:"amount"`
	Currency    string          `gorm:"size:3;not null"      json:"currency"`
	Description string          `gorm:"size:255"             json:"description"`
	Date        time.Time       `gorm:"not null"             json:"date"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

package model

import (
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Date representa una fecha sin componente horario. Serializa como "YYYY-MM-DD".
type Date struct {
	time.Time
}

func (d Date) MarshalJSON() ([]byte, error) {
	return []byte(`"` + d.Time.UTC().Format("2006-01-02") + `"`), nil
}

func (d *Date) UnmarshalJSON(data []byte) error {
	s := string(data)
	if len(s) < 2 || s[0] != '"' || s[len(s)-1] != '"' {
		return fmt.Errorf("fecha inválida: %s", s)
	}
	t, err := time.Parse("2006-01-02", s[1:len(s)-1])
	if err != nil {
		return err
	}
	d.Time = t
	return nil
}

func (d Date) Value() (driver.Value, error) {
	return d.Time, nil
}

func (d *Date) Scan(value any) error {
	if value == nil {
		return nil
	}
	t, ok := value.(time.Time)
	if !ok {
		return fmt.Errorf("Date.Scan: tipo inesperado %T", value)
	}
	d.Time = t.UTC()
	return nil
}

type TransactionType string
type TransactionStatus string

const (
	TransactionTypeIncome  TransactionType = "income"
	TransactionTypeExpense TransactionType = "expense"
)

const (
	TransactionStatusConfirmed TransactionStatus = "confirmed"
	TransactionStatusPending   TransactionStatus = "pending"
)

type Transaction struct {
	ID          uuid.UUID         `gorm:"type:uuid;primaryKey"         json:"id"`
	UserID      uuid.UUID         `gorm:"type:uuid;not null"           json:"user_id"`
	CategoryID  uuid.UUID         `gorm:"type:uuid;not null"           json:"category_id"`
	Type        TransactionType   `gorm:"not null"                     json:"type"`
	Amount      float64           `gorm:"not null"                     json:"amount"`
	Currency    string            `gorm:"size:3;not null"              json:"currency"`
	Description string            `gorm:"size:255"                     json:"description"`
	Date        Date              `gorm:"not null"                     json:"date"`
	Status      TransactionStatus `gorm:"not null;default:'confirmed'" json:"status"`
	RecurringID *uuid.UUID        `gorm:"type:uuid"                    json:"recurring_id"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

func (t *Transaction) BeforeCreate(tx *gorm.DB) error {
	t.ID = uuid.New()
	return nil
}

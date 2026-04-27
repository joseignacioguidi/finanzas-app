package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"gorm.io/gorm"
)

type TransactionRepository interface {
	FindAll(ctx context.Context, userID uuid.UUID) ([]model.Transaction, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.Transaction, error)
	Create(ctx context.Context, tx *model.Transaction) error
	Update(ctx context.Context, tx *model.Transaction) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type transactionRepo struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepo{db: db}
}

func (r *transactionRepo) FindAll(ctx context.Context, userID uuid.UUID) ([]model.Transaction, error) {
	// TODO: implementar consulta con filtros
	return nil, nil
}

func (r *transactionRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Transaction, error) {
	// TODO: implementar consulta por ID
	return nil, nil
}

func (r *transactionRepo) Create(ctx context.Context, tx *model.Transaction) error {
	// TODO: implementar inserción
	return nil
}

func (r *transactionRepo) Update(ctx context.Context, tx *model.Transaction) error {
	// TODO: implementar actualización
	return nil
}

func (r *transactionRepo) Delete(ctx context.Context, id uuid.UUID) error {
	// TODO: implementar eliminación
	return nil
}

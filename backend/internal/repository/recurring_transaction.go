package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"gorm.io/gorm"
)

type RecurringTransactionRepository interface {
	FindAll(ctx context.Context, userID uuid.UUID) ([]model.RecurringTransaction, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.RecurringTransaction, error)
	Create(ctx context.Context, rt *model.RecurringTransaction) error
	Deactivate(ctx context.Context, id uuid.UUID) error
}

type recurringTransactionRepo struct {
	db *gorm.DB
}

func NewRecurringTransactionRepository(db *gorm.DB) RecurringTransactionRepository {
	return &recurringTransactionRepo{db: db}
}

func (r *recurringTransactionRepo) FindAll(ctx context.Context, userID uuid.UUID) ([]model.RecurringTransaction, error) {
	rts := make([]model.RecurringTransaction, 0)
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND active = true", userID).
		Order("created_at DESC").
		Find(&rts).Error
	return rts, err
}

func (r *recurringTransactionRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.RecurringTransaction, error) {
	var rt model.RecurringTransaction
	if err := r.db.WithContext(ctx).First(&rt, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *recurringTransactionRepo) Create(ctx context.Context, rt *model.RecurringTransaction) error {
	return r.db.WithContext(ctx).Create(rt).Error
}

func (r *recurringTransactionRepo) Deactivate(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&model.RecurringTransaction{}).
		Where("id = ?", id).
		Update("active", false).Error
}

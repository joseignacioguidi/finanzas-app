package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"gorm.io/gorm"
)

type SavingRepository interface {
	FindAll(ctx context.Context, userID uuid.UUID) ([]model.Saving, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.Saving, error)
	Create(ctx context.Context, saving *model.Saving) error
	Update(ctx context.Context, saving *model.Saving) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type savingRepo struct {
	db *gorm.DB
}

func NewSavingRepository(db *gorm.DB) SavingRepository {
	return &savingRepo{db: db}
}

func (r *savingRepo) FindAll(ctx context.Context, userID uuid.UUID) ([]model.Saving, error) {
	var savings []model.Saving
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at ASC").Find(&savings).Error
	return savings, err
}

func (r *savingRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Saving, error) {
	var s model.Saving
	err := r.db.WithContext(ctx).First(&s, "id = ?", id).Error
	return &s, err
}

func (r *savingRepo) Create(ctx context.Context, saving *model.Saving) error {
	return r.db.WithContext(ctx).Create(saving).Error
}

func (r *savingRepo) Update(ctx context.Context, saving *model.Saving) error {
	return r.db.WithContext(ctx).Save(saving).Error
}

func (r *savingRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.Saving{}, "id = ?", id).Error
}

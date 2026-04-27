package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"gorm.io/gorm"
)

type CategoryRepository interface {
	FindAll(ctx context.Context, userID uuid.UUID) ([]model.Category, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.Category, error)
	Create(ctx context.Context, cat *model.Category) error
	Update(ctx context.Context, cat *model.Category) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type categoryRepo struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepo{db: db}
}

func (r *categoryRepo) FindAll(ctx context.Context, userID uuid.UUID) ([]model.Category, error) {
	var cats []model.Category
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&cats).Error; err != nil {
		return nil, err
	}
	return cats, nil
}

func (r *categoryRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Category, error) {
	var cat model.Category
	if err := r.db.WithContext(ctx).First(&cat, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &cat, nil
}

func (r *categoryRepo) Create(ctx context.Context, cat *model.Category) error {
	return r.db.WithContext(ctx).Create(cat).Error
}

func (r *categoryRepo) Update(ctx context.Context, cat *model.Category) error {
	return r.db.WithContext(ctx).Save(cat).Error
}

func (r *categoryRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.Category{}, "id = ?", id).Error
}

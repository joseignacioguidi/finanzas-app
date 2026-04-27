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
	// TODO: implementar consulta por userID
	return nil, nil
}

func (r *categoryRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Category, error) {
	// TODO: implementar consulta por ID
	return nil, nil
}

func (r *categoryRepo) Create(ctx context.Context, cat *model.Category) error {
	// TODO: implementar inserción
	return nil
}

func (r *categoryRepo) Update(ctx context.Context, cat *model.Category) error {
	// TODO: implementar actualización
	return nil
}

func (r *categoryRepo) Delete(ctx context.Context, id uuid.UUID) error {
	// TODO: implementar eliminación
	return nil
}

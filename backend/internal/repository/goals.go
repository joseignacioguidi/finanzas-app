package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"gorm.io/gorm"
)

type GoalRepository interface {
	FindAll(ctx context.Context, userID uuid.UUID) ([]model.FinancialGoal, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.FinancialGoal, error)
	Create(ctx context.Context, goal *model.FinancialGoal) error
	Update(ctx context.Context, goal *model.FinancialGoal) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type goalRepo struct {
	db *gorm.DB
}

func NewGoalRepository(db *gorm.DB) GoalRepository {
	return &goalRepo{db: db}
}

func (r *goalRepo) FindAll(ctx context.Context, userID uuid.UUID) ([]model.FinancialGoal, error) {
	goals := make([]model.FinancialGoal, 0)
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("target_date ASC").Find(&goals).Error
	return goals, err
}

func (r *goalRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.FinancialGoal, error) {
	var goal model.FinancialGoal
	err := r.db.WithContext(ctx).First(&goal, "id = ?", id).Error
	return &goal, err
}

func (r *goalRepo) Create(ctx context.Context, goal *model.FinancialGoal) error {
	return r.db.WithContext(ctx).Create(goal).Error
}

func (r *goalRepo) Update(ctx context.Context, goal *model.FinancialGoal) error {
	return r.db.WithContext(ctx).Save(goal).Error
}

func (r *goalRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.FinancialGoal{}, "id = ?", id).Error
}

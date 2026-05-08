package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"gorm.io/gorm"
)

type BudgetRow struct {
	model.Budget
	CategoryName  string  `json:"category_name"`
	CategoryColor string  `json:"category_color"`
	CategoryIcon  string  `json:"category_icon"`
	Spent         float64 `json:"spent"`
}

type BudgetRepository interface {
	FindMonthly(ctx context.Context, userID uuid.UUID, month, year int) ([]BudgetRow, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.Budget, error)
	FindByUnique(ctx context.Context, userID, categoryID uuid.UUID, month, year int) (*model.Budget, error)
	Create(ctx context.Context, budget *model.Budget) error
	Update(ctx context.Context, budget *model.Budget) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type budgetRepo struct {
	db *gorm.DB
}

func NewBudgetRepository(db *gorm.DB) BudgetRepository {
	return &budgetRepo{db: db}
}

func (r *budgetRepo) FindMonthly(ctx context.Context, userID uuid.UUID, month, year int) ([]BudgetRow, error) {
	rows := make([]BudgetRow, 0)
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			b.id, b.user_id, b.category_id, b.amount, b.month, b.year, b.created_at, b.updated_at,
			c.name  AS category_name,
			c.color AS category_color,
			c.icon  AS category_icon,
			COALESCE(SUM(t.base_amount), 0) AS spent
		FROM budgets b
		JOIN categories c ON c.id = b.category_id
		LEFT JOIN transactions t
			ON  t.category_id = b.category_id
			AND t.user_id     = b.user_id
			AND t.type        = 'expense'
			AND t.status      = 'confirmed'
			AND EXTRACT(MONTH FROM t.date) = b.month
			AND EXTRACT(YEAR  FROM t.date) = b.year
		WHERE b.user_id = ? AND b.month = ? AND b.year = ?
		GROUP BY b.id, c.name, c.color, c.icon
		ORDER BY c.name ASC
	`, userID, month, year).Scan(&rows).Error
	return rows, err
}

func (r *budgetRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Budget, error) {
	var b model.Budget
	err := r.db.WithContext(ctx).First(&b, "id = ?", id).Error
	return &b, err
}

func (r *budgetRepo) FindByUnique(ctx context.Context, userID, categoryID uuid.UUID, month, year int) (*model.Budget, error) {
	var b model.Budget
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND category_id = ? AND month = ? AND year = ?", userID, categoryID, month, year).
		First(&b).Error
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *budgetRepo) Create(ctx context.Context, budget *model.Budget) error {
	return r.db.WithContext(ctx).Create(budget).Error
}

func (r *budgetRepo) Update(ctx context.Context, budget *model.Budget) error {
	return r.db.WithContext(ctx).Save(budget).Error
}

func (r *budgetRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.Budget{}, "id = ?", id).Error
}

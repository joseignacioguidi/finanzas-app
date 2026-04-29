package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"gorm.io/gorm"
)

type TransactionFilter struct {
	Month      string // "YYYY-MM", opcional
	Year       string // "YYYY", opcional
	Type       string // "income" | "expense", opcional
	CategoryID string // UUID string, opcional
	Status     string // "confirmed" | "pending" | "" (todos)
}

type MonthlyStatRow struct {
	Month   string  `json:"month"`
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

type CategoryStatRow struct {
	CategoryID   string  `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Color        string  `json:"color"`
	Total        float64 `json:"total"`
}

type TransactionRepository interface {
	FindAll(ctx context.Context, userID uuid.UUID, filter TransactionFilter) ([]model.Transaction, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.Transaction, error)
	Create(ctx context.Context, tx *model.Transaction) error
	Update(ctx context.Context, tx *model.Transaction) error
	Delete(ctx context.Context, id uuid.UUID) error
	DeletePendingByRecurringID(ctx context.Context, recurringID uuid.UUID) error
	CountByCategory(ctx context.Context, categoryID uuid.UUID) (int64, error)
	MonthlyStats(ctx context.Context, userID uuid.UUID) ([]MonthlyStatRow, error)
	CategoryStats(ctx context.Context, userID uuid.UUID) ([]CategoryStatRow, error)
}

type transactionRepo struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepo{db: db}
}

func (r *transactionRepo) FindAll(ctx context.Context, userID uuid.UUID, filter TransactionFilter) ([]model.Transaction, error) {
	txs := make([]model.Transaction, 0)
	q := r.db.WithContext(ctx).Where("user_id = ?", userID)

	if filter.Month != "" {
		q = q.Where("TO_CHAR(date, 'YYYY-MM') = ?", filter.Month)
	}
	if filter.Year != "" {
		q = q.Where("TO_CHAR(date, 'YYYY') = ?", filter.Year)
	}
	if filter.Type != "" {
		q = q.Where("type = ?", filter.Type)
	}
	if filter.CategoryID != "" {
		q = q.Where("category_id = ?", filter.CategoryID)
	}
	if filter.Status != "" {
		q = q.Where("status = ?", filter.Status)
	}

	if err := q.Order("date DESC").Find(&txs).Error; err != nil {
		return nil, err
	}
	return txs, nil
}

func (r *transactionRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Transaction, error) {
	var tx model.Transaction
	if err := r.db.WithContext(ctx).First(&tx, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *transactionRepo) Create(ctx context.Context, tx *model.Transaction) error {
	return r.db.WithContext(ctx).Create(tx).Error
}

func (r *transactionRepo) Update(ctx context.Context, tx *model.Transaction) error {
	return r.db.WithContext(ctx).Save(tx).Error
}

func (r *transactionRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.Transaction{}, "id = ?", id).Error
}

func (r *transactionRepo) DeletePendingByRecurringID(ctx context.Context, recurringID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("recurring_id = ? AND status = ?", recurringID, model.TransactionStatusPending).
		Delete(&model.Transaction{}).Error
}

func (r *transactionRepo) CountByCategory(ctx context.Context, categoryID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Transaction{}).Where("category_id = ?", categoryID).Count(&count).Error
	return count, err
}

func (r *transactionRepo) MonthlyStats(ctx context.Context, userID uuid.UUID) ([]MonthlyStatRow, error) {
	rows := make([]MonthlyStatRow, 0)
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
			SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
			SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
		FROM transactions
		WHERE user_id = ?
		  AND status = 'confirmed'
		  AND date >= NOW() - INTERVAL '12 months'
		GROUP BY DATE_TRUNC('month', date)
		ORDER BY DATE_TRUNC('month', date)
	`, userID).Scan(&rows).Error
	return rows, err
}

func (r *transactionRepo) CategoryStats(ctx context.Context, userID uuid.UUID) ([]CategoryStatRow, error) {
	rows := make([]CategoryStatRow, 0)
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			t.category_id::text AS category_id,
			c.name              AS category_name,
			c.color,
			SUM(t.amount)       AS total
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ?
		  AND t.status = 'confirmed'
		  AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', NOW())
		GROUP BY t.category_id, c.name, c.color
		ORDER BY total DESC
	`, userID).Scan(&rows).Error
	return rows, err
}

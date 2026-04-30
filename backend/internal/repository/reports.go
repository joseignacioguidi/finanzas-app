package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReportSummaryRow struct {
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
}

type ReportByCategoryRow struct {
	CategoryID   string  `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Color        string  `json:"color"`
	Icon         string  `json:"icon"`
	Total        float64 `json:"total"`
}

type ReportMonthlyRow struct {
	Month   string  `json:"month"`
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

type TopTransactionRow struct {
	ID            string  `json:"id"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Description   string  `json:"description"`
	Date          string  `json:"date"`
	CategoryID    string  `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	CategoryColor string  `json:"category_color"`
	CategoryIcon  string  `json:"category_icon"`
	CategoryType  string  `json:"category_type"`
}

type TransactionExportRow struct {
	ID           string  `json:"id"`
	Date         string  `json:"date"`
	Description  string  `json:"description"`
	CategoryName string  `json:"category_name"`
	CategoryType string  `json:"category_type"`
	Amount       float64 `json:"amount"`
	Currency     string  `json:"currency"`
}

type SavingsMonthRow struct {
	Month   string  `json:"month"`
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

type TrendPeriodRow struct {
	CategoryID   string  `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Total        float64 `json:"total"`
}

type ReportsRepository interface {
	Summary(ctx context.Context, userID uuid.UUID, from, to string) (*ReportSummaryRow, error)
	ByCategory(ctx context.Context, userID uuid.UUID, from, to string) ([]ReportByCategoryRow, error)
	Monthly(ctx context.Context, userID uuid.UUID, year int) ([]ReportMonthlyRow, error)
	TopTransactions(ctx context.Context, userID uuid.UUID, from, to string, limit int) ([]TopTransactionRow, error)
	ExportTransactions(ctx context.Context, userID uuid.UUID, from, to string) ([]TransactionExportRow, error)
	SavingsByMonth(ctx context.Context, userID uuid.UUID, fromDate string) ([]SavingsMonthRow, error)
	TrendPeriod(ctx context.Context, userID uuid.UUID, from, to string) ([]TrendPeriodRow, error)
	AvgMonthlyExpense(ctx context.Context, userID uuid.UUID, fromDate string, months int) (float64, error)
}

type reportsRepo struct {
	db *gorm.DB
}

func NewReportsRepository(db *gorm.DB) ReportsRepository {
	return &reportsRepo{db: db}
}

func (r *reportsRepo) Summary(ctx context.Context, userID uuid.UUID, from, to string) (*ReportSummaryRow, error) {
	var result ReportSummaryRow
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END), 0)  AS total_income,
			COALESCE(SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ?
		  AND t.date BETWEEN ?::date AND ?::date
		  AND t.status = 'confirmed'
		  AND c.type IN ('income', 'expense')
	`, userID, from, to).Scan(&result).Error
	return &result, err
}

func (r *reportsRepo) ByCategory(ctx context.Context, userID uuid.UUID, from, to string) ([]ReportByCategoryRow, error) {
	rows := make([]ReportByCategoryRow, 0)
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			t.category_id::text        AS category_id,
			c.name                     AS category_name,
			c.color,
			COALESCE(c.icon, '')       AS icon,
			SUM(t.amount)              AS total
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ?
		  AND t.date BETWEEN ?::date AND ?::date
		  AND t.status = 'confirmed'
		  AND c.type = 'expense'
		GROUP BY t.category_id, c.name, c.color, c.icon
		ORDER BY total DESC
	`, userID, from, to).Scan(&rows).Error
	return rows, err
}

func (r *reportsRepo) Monthly(ctx context.Context, userID uuid.UUID, year int) ([]ReportMonthlyRow, error) {
	rows := make([]ReportMonthlyRow, 0)
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			TO_CHAR(DATE_TRUNC('month', t.date), 'YYYY-MM') AS month,
			COALESCE(SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END), 0)  AS income,
			COALESCE(SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ?
		  AND EXTRACT(YEAR FROM t.date) = ?
		  AND t.status = 'confirmed'
		  AND c.type IN ('income', 'expense')
		GROUP BY DATE_TRUNC('month', t.date)
		ORDER BY DATE_TRUNC('month', t.date)
	`, userID, year).Scan(&rows).Error
	return rows, err
}

func (r *reportsRepo) TopTransactions(ctx context.Context, userID uuid.UUID, from, to string, limit int) ([]TopTransactionRow, error) {
	rows := make([]TopTransactionRow, 0)
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			t.id::text                       AS id,
			t.amount,
			t.currency,
			COALESCE(t.description, '')      AS description,
			TO_CHAR(t.date, 'YYYY-MM-DD')   AS date,
			t.category_id::text              AS category_id,
			c.name                           AS category_name,
			c.color                          AS category_color,
			COALESCE(c.icon, '')             AS category_icon,
			c.type::text                     AS category_type
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ?
		  AND t.date BETWEEN ?::date AND ?::date
		  AND t.status = 'confirmed'
		  AND c.type IN ('income', 'expense')
		ORDER BY t.amount DESC
		LIMIT ?
	`, userID, from, to, limit).Scan(&rows).Error
	return rows, err
}

func (r *reportsRepo) ExportTransactions(ctx context.Context, userID uuid.UUID, from, to string) ([]TransactionExportRow, error) {
	rows := make([]TransactionExportRow, 0)
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			t.id::text                       AS id,
			TO_CHAR(t.date, 'YYYY-MM-DD')   AS date,
			COALESCE(t.description, '')      AS description,
			c.name                           AS category_name,
			c.type::text                     AS category_type,
			t.amount,
			t.currency
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ?
		  AND t.date BETWEEN ?::date AND ?::date
		  AND t.status = 'confirmed'
		ORDER BY t.date DESC
	`, userID, from, to).Scan(&rows).Error
	return rows, err
}

func (r *reportsRepo) SavingsByMonth(ctx context.Context, userID uuid.UUID, fromDate string) ([]SavingsMonthRow, error) {
	rows := make([]SavingsMonthRow, 0)
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			TO_CHAR(DATE_TRUNC('month', t.date), 'YYYY-MM') AS month,
			COALESCE(SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END), 0)  AS income,
			COALESCE(SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ?
		  AND t.date >= ?::date
		  AND t.status = 'confirmed'
		  AND c.type IN ('income', 'expense')
		GROUP BY DATE_TRUNC('month', t.date)
		ORDER BY DATE_TRUNC('month', t.date)
	`, userID, fromDate).Scan(&rows).Error
	return rows, err
}

func (r *reportsRepo) TrendPeriod(ctx context.Context, userID uuid.UUID, from, to string) ([]TrendPeriodRow, error) {
	rows := make([]TrendPeriodRow, 0)
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			t.category_id::text AS category_id,
			c.name              AS category_name,
			SUM(t.amount)       AS total
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ?
		  AND t.date BETWEEN ?::date AND ?::date
		  AND t.status = 'confirmed'
		  AND c.type = 'expense'
		GROUP BY t.category_id, c.name
	`, userID, from, to).Scan(&rows).Error
	return rows, err
}

func (r *reportsRepo) AvgMonthlyExpense(ctx context.Context, userID uuid.UUID, fromDate string, months int) (float64, error) {
	var total float64
	err := r.db.WithContext(ctx).Raw(`
		SELECT COALESCE(SUM(t.amount), 0)
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ?
		  AND t.date >= ?::date
		  AND t.status = 'confirmed'
		  AND c.type = 'expense'
	`, userID, fromDate).Scan(&total).Error
	if err != nil || months == 0 {
		return 0, err
	}
	return total / float64(months), nil
}

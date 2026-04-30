package service

import (
	"context"
	"math"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
)

type ReportsService struct {
	repo repository.ReportsRepository
}

func NewReportsService(repo repository.ReportsRepository) *ReportsService {
	return &ReportsService{repo: repo}
}

type SummaryResult struct {
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	Balance      float64 `json:"balance"`
	SavingsRate  float64 `json:"savings_rate"`
}

type ByCategoryResult struct {
	CategoryID   string  `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Color        string  `json:"color"`
	Icon         string  `json:"icon"`
	Total        float64 `json:"total"`
	Percentage   float64 `json:"percentage"`
}

type TopTransactionsResult struct {
	Income  []repository.TopTransactionRow `json:"income"`
	Expense []repository.TopTransactionRow `json:"expense"`
}

type Projection struct {
	Min float64 `json:"min"`
	Max float64 `json:"max"`
}

type SavingsMonthResult struct {
	Month         string  `json:"month"`
	Income        float64 `json:"income"`
	Expense       float64 `json:"expense"`
	SavingsAmount float64 `json:"savings_amount"`
	SavingsRate   float64 `json:"savings_rate"`
}

type SavingsResult struct {
	Months        []SavingsMonthResult `json:"months"`
	Projection6M  Projection           `json:"projection_6m"`
	Projection12M Projection           `json:"projection_12m"`
}

type TrendResult struct {
	CategoryID    string  `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	AvgCurrent    float64 `json:"avg_current"`
	AvgPrevious   float64 `json:"avg_previous"`
	ChangePercent float64 `json:"change_percent"`
	ChangeAmount  float64 `json:"change_amount"`
}

// CalculateSavingsRate es exportada para tests unitarios.
func CalculateSavingsRate(income, expense float64) float64 {
	if income == 0 {
		return 0
	}
	return math.Round(((income-expense)/income)*10000) / 100
}

// CalculateProjection es exportada para tests unitarios.
func CalculateProjection(avgMonthly float64, months int) Projection {
	total := avgMonthly * float64(months)
	a := math.Round(total*0.8*100) / 100
	b := math.Round(total*1.2*100) / 100
	return Projection{
		Min: math.Min(a, b),
		Max: math.Max(a, b),
	}
}

func (s *ReportsService) Summary(ctx context.Context, userID uuid.UUID, from, to string) (*SummaryResult, error) {
	row, err := s.repo.Summary(ctx, userID, from, to)
	if err != nil {
		return nil, err
	}
	balance := row.TotalIncome - row.TotalExpense
	return &SummaryResult{
		TotalIncome:  row.TotalIncome,
		TotalExpense: row.TotalExpense,
		Balance:      balance,
		SavingsRate:  CalculateSavingsRate(row.TotalIncome, row.TotalExpense),
	}, nil
}

func (s *ReportsService) ByCategory(ctx context.Context, userID uuid.UUID, from, to string) ([]ByCategoryResult, error) {
	rows, err := s.repo.ByCategory(ctx, userID, from, to)
	if err != nil {
		return nil, err
	}
	var totalExpense float64
	for _, r := range rows {
		totalExpense += r.Total
	}
	result := make([]ByCategoryResult, len(rows))
	for i, r := range rows {
		var pct float64
		if totalExpense > 0 {
			pct = math.Round((r.Total/totalExpense)*10000) / 100
		}
		result[i] = ByCategoryResult{
			CategoryID:   r.CategoryID,
			CategoryName: r.CategoryName,
			Color:        r.Color,
			Icon:         r.Icon,
			Total:        r.Total,
			Percentage:   pct,
		}
	}
	return result, nil
}

func (s *ReportsService) Monthly(ctx context.Context, userID uuid.UUID, year int) ([]repository.ReportMonthlyRow, error) {
	return s.repo.Monthly(ctx, userID, year)
}

func (s *ReportsService) TopTransactions(ctx context.Context, userID uuid.UUID, from, to string, limit int) (*TopTransactionsResult, error) {
	if limit <= 0 {
		limit = 10
	}
	rows, err := s.repo.TopTransactions(ctx, userID, from, to, limit)
	if err != nil {
		return nil, err
	}
	result := &TopTransactionsResult{
		Income:  make([]repository.TopTransactionRow, 0),
		Expense: make([]repository.TopTransactionRow, 0),
	}
	for _, r := range rows {
		if r.CategoryType == "income" {
			result.Income = append(result.Income, r)
		} else {
			result.Expense = append(result.Expense, r)
		}
	}
	return result, nil
}

func (s *ReportsService) ExportTransactions(ctx context.Context, userID uuid.UUID, from, to string) ([]repository.TransactionExportRow, error) {
	return s.repo.ExportTransactions(ctx, userID, from, to)
}

func (s *ReportsService) Savings(ctx context.Context, userID uuid.UUID, months int) (*SavingsResult, error) {
	fromDate := time.Now().AddDate(0, -months, 0).Format("2006-01-02")
	rows, err := s.repo.SavingsByMonth(ctx, userID, fromDate)
	if err != nil {
		return nil, err
	}

	monthResults := make([]SavingsMonthResult, len(rows))
	for i, r := range rows {
		savings := r.Income - r.Expense
		monthResults[i] = SavingsMonthResult{
			Month:         r.Month,
			Income:        r.Income,
			Expense:       r.Expense,
			SavingsAmount: math.Round(savings*100) / 100,
			SavingsRate:   CalculateSavingsRate(r.Income, r.Expense),
		}
	}

	avgSavings := avgLast3Savings(monthResults)
	return &SavingsResult{
		Months:        monthResults,
		Projection6M:  CalculateProjection(avgSavings, 6),
		Projection12M: CalculateProjection(avgSavings, 12),
	}, nil
}

func (s *ReportsService) Trends(ctx context.Context, userID uuid.UUID, months int) ([]TrendResult, error) {
	now := time.Now()
	currentTo := now.Format("2006-01-02")
	currentFrom := now.AddDate(0, -months, 0).Format("2006-01-02")
	previousTo := currentFrom
	previousFrom := now.AddDate(0, -2*months, 0).Format("2006-01-02")

	currentRows, err := s.repo.TrendPeriod(ctx, userID, currentFrom, currentTo)
	if err != nil {
		return nil, err
	}
	previousRows, err := s.repo.TrendPeriod(ctx, userID, previousFrom, previousTo)
	if err != nil {
		return nil, err
	}

	prevMap := make(map[string]float64)
	for _, r := range previousRows {
		prevMap[r.CategoryID] = r.Total
	}

	results := make([]TrendResult, 0, len(currentRows))
	for _, cur := range currentRows {
		avgCurrent := cur.Total / float64(months)
		avgPrevious := prevMap[cur.CategoryID] / float64(months)
		var changePercent float64
		if avgPrevious > 0 {
			changePercent = math.Round(((avgCurrent-avgPrevious)/avgPrevious)*10000) / 100
		}
		results = append(results, TrendResult{
			CategoryID:    cur.CategoryID,
			CategoryName:  cur.CategoryName,
			AvgCurrent:    math.Round(avgCurrent*100) / 100,
			AvgPrevious:   math.Round(avgPrevious*100) / 100,
			ChangePercent: changePercent,
			ChangeAmount:  math.Round((avgCurrent-avgPrevious)*100) / 100,
		})
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].ChangePercent > results[j].ChangePercent
	})

	return results, nil
}

func avgLast3Savings(months []SavingsMonthResult) float64 {
	n := len(months)
	if n == 0 {
		return 0
	}
	start := n - 3
	if start < 0 {
		start = 0
	}
	var sum float64
	for i := start; i < n; i++ {
		sum += months[i].SavingsAmount
	}
	return sum / float64(n-start)
}

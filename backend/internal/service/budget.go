package service

import (
	"context"
	"errors"
	"math"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
	"gorm.io/gorm"
)

var ErrDuplicateBudget = errors.New("ya existe un presupuesto para esta categoría en este período")
var ErrBudgetNotFound = errors.New("presupuesto no encontrado")

type BudgetService struct {
	repo    repository.BudgetRepository
	catRepo repository.CategoryRepository
}

func NewBudgetService(repo repository.BudgetRepository, catRepo repository.CategoryRepository) *BudgetService {
	return &BudgetService{repo: repo, catRepo: catRepo}
}

type BudgetInput struct {
	CategoryID string  `json:"category_id" binding:"required"`
	Amount     float64 `json:"amount"      binding:"required,gt=0"`
	Month      int     `json:"month"       binding:"required,min=1,max=12"`
	Year       int     `json:"year"        binding:"required,min=2000"`
}

type BudgetUpdateInput struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

type BudgetStatus string

const (
	BudgetStatusOk       BudgetStatus = "ok"
	BudgetStatusWarning  BudgetStatus = "warning"
	BudgetStatusExceeded BudgetStatus = "exceeded"
)

type BudgetResult struct {
	repository.BudgetRow
	Percentage float64      `json:"percentage"`
	Status     BudgetStatus `json:"status"`
}

func budgetStatus(pct float64) BudgetStatus {
	switch {
	case pct > 100:
		return BudgetStatusExceeded
	case pct >= 80:
		return BudgetStatusWarning
	default:
		return BudgetStatusOk
	}
}

func (s *BudgetService) GetMonthly(ctx context.Context, userID uuid.UUID, month, year int) ([]BudgetResult, error) {
	rows, err := s.repo.FindMonthly(ctx, userID, month, year)
	if err != nil {
		return nil, err
	}

	results := make([]BudgetResult, len(rows))
	for i, row := range rows {
		var pct float64
		if row.Amount > 0 {
			pct = math.Round((row.Spent/row.Amount)*1000) / 10
		}
		results[i] = BudgetResult{
			BudgetRow:  row,
			Percentage: pct,
			Status:     budgetStatus(pct),
		}
	}
	return results, nil
}

func (s *BudgetService) Create(ctx context.Context, userID uuid.UUID, input BudgetInput) (*model.Budget, error) {
	categoryID, err := uuid.Parse(input.CategoryID)
	if err != nil {
		return nil, errors.New("category_id inválido")
	}

	cat, err := s.catRepo.FindByID(ctx, categoryID)
	if err != nil || cat.UserID != userID {
		return nil, errors.New("categoría no encontrada")
	}

	existing, err := s.repo.FindByUnique(ctx, userID, categoryID, input.Month, input.Year)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existing != nil {
		return nil, ErrDuplicateBudget
	}

	budget := &model.Budget{
		UserID:     userID,
		CategoryID: categoryID,
		Amount:     input.Amount,
		Month:      input.Month,
		Year:       input.Year,
	}
	if err := s.repo.Create(ctx, budget); err != nil {
		return nil, err
	}
	return budget, nil
}

func (s *BudgetService) Update(ctx context.Context, userID, id uuid.UUID, input BudgetUpdateInput) (*model.Budget, error) {
	budget, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBudgetNotFound
		}
		return nil, err
	}
	if budget.UserID != userID {
		return nil, errors.New("no autorizado")
	}

	budget.Amount = input.Amount
	if err := s.repo.Update(ctx, budget); err != nil {
		return nil, err
	}
	return budget, nil
}

func (s *BudgetService) Delete(ctx context.Context, userID, id uuid.UUID) error {
	budget, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrBudgetNotFound
		}
		return err
	}
	if budget.UserID != userID {
		return errors.New("no autorizado")
	}
	return s.repo.Delete(ctx, id)
}

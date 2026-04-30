package service

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
)

type GoalsService struct {
	repo        repository.GoalRepository
	reportsRepo repository.ReportsRepository
}

func NewGoalsService(repo repository.GoalRepository, reportsRepo repository.ReportsRepository) *GoalsService {
	return &GoalsService{repo: repo, reportsRepo: reportsRepo}
}

type GoalInput struct {
	Name         string  `json:"name"          binding:"required,max=100"`
	TargetAmount float64 `json:"target_amount" binding:"required,gt=0"`
	TargetDate   string  `json:"target_date"   binding:"required"`
}

type GoalStatus string

const (
	GoalStatusOnTrack        GoalStatus = "on_track"
	GoalStatusSlightlyBehind GoalStatus = "slightly_behind"
	GoalStatusOffTrack       GoalStatus = "off_track"
)

type GoalResult struct {
	model.FinancialGoal
	MonthlyRequired    float64    `json:"monthly_required"`
	CurrentSavingsRate float64    `json:"current_savings_rate"`
	Status             GoalStatus `json:"status"`
	AdjustmentNeeded   float64    `json:"adjustment_needed"`
}

type EmergencyFundResult struct {
	AvgMonthlyExpense float64 `json:"avg_monthly_expense"`
	Recommended3M     float64 `json:"recommended_3m"`
	Recommended6M     float64 `json:"recommended_6m"`
}

// CalculateGoalStatus es exportada para tests unitarios.
func CalculateGoalStatus(currentRate, required float64) GoalStatus {
	if currentRate >= required {
		return GoalStatusOnTrack
	}
	if required > 0 && currentRate >= required*0.8 {
		return GoalStatusSlightlyBehind
	}
	return GoalStatusOffTrack
}

func (s *GoalsService) GetAll(ctx context.Context, userID uuid.UUID) ([]GoalResult, error) {
	goals, err := s.repo.FindAll(ctx, userID)
	if err != nil {
		return nil, err
	}

	currentSavingsRate, err := s.currentSavingsRate(ctx, userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	results := make([]GoalResult, len(goals))
	for i, g := range goals {
		monthsLeft := monthsBetween(now, g.TargetDate.Time)
		var monthlyRequired float64
		if monthsLeft > 0 {
			monthlyRequired = math.Round((g.TargetAmount/float64(monthsLeft))*100) / 100
		}

		status := CalculateGoalStatus(currentSavingsRate, monthlyRequired)
		var adjustmentNeeded float64
		if status != GoalStatusOnTrack {
			diff := monthlyRequired - currentSavingsRate
			if diff > 0 {
				adjustmentNeeded = math.Round(diff*100) / 100
			}
		}

		results[i] = GoalResult{
			FinancialGoal:      g,
			MonthlyRequired:    monthlyRequired,
			CurrentSavingsRate: math.Round(currentSavingsRate*100) / 100,
			Status:             status,
			AdjustmentNeeded:   adjustmentNeeded,
		}
	}
	return results, nil
}

func (s *GoalsService) Create(ctx context.Context, userID uuid.UUID, input GoalInput) (*model.FinancialGoal, error) {
	targetDate, err := time.Parse("2006-01-02", input.TargetDate)
	if err != nil {
		return nil, errors.New("target_date inválida, usar formato YYYY-MM-DD")
	}
	goal := &model.FinancialGoal{
		UserID:       userID,
		Name:         input.Name,
		TargetAmount: input.TargetAmount,
		TargetDate:   model.Date{Time: targetDate},
	}
	if err := s.repo.Create(ctx, goal); err != nil {
		return nil, err
	}
	return goal, nil
}

func (s *GoalsService) Update(ctx context.Context, userID uuid.UUID, id uuid.UUID, input GoalInput) (*model.FinancialGoal, error) {
	goal, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if goal.UserID != userID {
		return nil, errors.New("no autorizado")
	}
	targetDate, err := time.Parse("2006-01-02", input.TargetDate)
	if err != nil {
		return nil, errors.New("target_date inválida, usar formato YYYY-MM-DD")
	}
	goal.Name = input.Name
	goal.TargetAmount = input.TargetAmount
	goal.TargetDate = model.Date{Time: targetDate}
	if err := s.repo.Update(ctx, goal); err != nil {
		return nil, err
	}
	return goal, nil
}

func (s *GoalsService) Delete(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	goal, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if goal.UserID != userID {
		return errors.New("no autorizado")
	}
	return s.repo.Delete(ctx, id)
}

func (s *GoalsService) EmergencyFund(ctx context.Context, userID uuid.UUID) (*EmergencyFundResult, error) {
	fromDate := time.Now().AddDate(0, -3, 0).Format("2006-01-02")
	avg, err := s.reportsRepo.AvgMonthlyExpense(ctx, userID, fromDate, 3)
	if err != nil {
		return nil, err
	}
	return &EmergencyFundResult{
		AvgMonthlyExpense: math.Round(avg*100) / 100,
		Recommended3M:     math.Round(avg*3*100) / 100,
		Recommended6M:     math.Round(avg*6*100) / 100,
	}, nil
}

func (s *GoalsService) currentSavingsRate(ctx context.Context, userID uuid.UUID) (float64, error) {
	fromDate := time.Now().AddDate(0, -3, 0).Format("2006-01-02")
	rows, err := s.reportsRepo.SavingsByMonth(ctx, userID, fromDate)
	if err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, nil
	}
	var total float64
	for _, r := range rows {
		total += r.Income - r.Expense
	}
	return total / float64(len(rows)), nil
}

func monthsBetween(from, to time.Time) int {
	if to.Before(from) {
		return 0
	}
	total := (to.Year()-from.Year())*12 + int(to.Month()) - int(from.Month())
	if total < 1 {
		return 1
	}
	return total
}

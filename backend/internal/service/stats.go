package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
)

type StatsService struct {
	txRepo repository.TransactionRepository
}

func NewStatsService(txRepo repository.TransactionRepository) *StatsService {
	return &StatsService{txRepo: txRepo}
}

func (s *StatsService) Monthly(ctx context.Context, userID uuid.UUID) ([]repository.MonthlyStatRow, error) {
	return s.txRepo.MonthlyStats(ctx, userID)
}

func (s *StatsService) Categories(ctx context.Context, userID uuid.UUID) ([]repository.CategoryStatRow, error) {
	return s.txRepo.CategoryStats(ctx, userID)
}

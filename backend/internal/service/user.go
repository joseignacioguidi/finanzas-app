package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
)

var supportedCurrencies = map[string]bool{"ARS": true, "USD": true, "EUR": true}

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetMe(ctx context.Context, userID uuid.UUID) (*model.User, error) {
	return s.repo.FindByID(ctx, userID)
}

func (s *UserService) UpdateBaseCurrency(ctx context.Context, userID uuid.UUID, currency string) (*model.User, error) {
	if !supportedCurrencies[currency] {
		return nil, errors.New("moneda no soportada, usar ARS, USD o EUR")
	}
	if err := s.repo.UpdateBaseCurrency(ctx, userID, currency); err != nil {
		return nil, err
	}
	return s.repo.FindByID(ctx, userID)
}

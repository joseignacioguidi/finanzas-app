package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
	"gorm.io/gorm"
)

var ErrSavingNotFound = errors.New("ahorro no encontrado")

type SavingService struct {
	repo        repository.SavingRepository
	userRepo    repository.UserRepository
	exchangeSvc *ExchangeRateService
}

func NewSavingService(
	repo repository.SavingRepository,
	userRepo repository.UserRepository,
	exchangeSvc *ExchangeRateService,
) *SavingService {
	return &SavingService{repo: repo, userRepo: userRepo, exchangeSvc: exchangeSvc}
}

type SavingInput struct {
	Name        string  `json:"name"        binding:"required"`
	Type        string  `json:"type"        binding:"required,oneof=cash bank virtual_wallet"`
	Amount      float64 `json:"amount"      binding:"required,gt=0"`
	Currency    string  `json:"currency"    binding:"required,len=3"`
	Description string  `json:"description"`
}

type SavingResult struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	Amount       float64   `json:"amount"`
	Currency     string    `json:"currency"`
	ExchangeRate float64   `json:"exchange_rate"`
	BaseAmount   float64   `json:"base_amount"`
	Description  string    `json:"description"`
	CreatedAt    string    `json:"created_at"`
	UpdatedAt    string    `json:"updated_at"`
}

type SavingsResponse struct {
	Savings         []SavingResult `json:"savings"`
	TotalBaseAmount float64        `json:"total_base_amount"`
	BaseCurrency    string         `json:"base_currency"`
}

func (s *SavingService) GetAll(ctx context.Context, userID uuid.UUID) (*SavingsResponse, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("usuario no encontrado")
	}

	savings, err := s.repo.FindAll(ctx, userID)
	if err != nil {
		return nil, err
	}

	results := make([]SavingResult, 0, len(savings))
	var total float64

	for _, sv := range savings {
		var rate float64
		var baseAmount float64

		if sv.Currency == user.BaseCurrency {
			rate = 1
			baseAmount = sv.Amount
		} else {
			r, _, rateErr := s.exchangeSvc.GetRate(sv.Currency, user.BaseCurrency)
			if rateErr != nil {
				return nil, rateErr
			}
			rate = r
			baseAmount = sv.Amount * r
		}

		total += baseAmount
		results = append(results, SavingResult{
			ID:           sv.ID,
			Name:         sv.Name,
			Type:         sv.Type,
			Amount:       sv.Amount,
			Currency:     sv.Currency,
			ExchangeRate: rate,
			BaseAmount:   baseAmount,
			Description:  sv.Description,
			CreatedAt:    sv.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:    sv.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	return &SavingsResponse{
		Savings:         results,
		TotalBaseAmount: total,
		BaseCurrency:    user.BaseCurrency,
	}, nil
}

func (s *SavingService) Create(ctx context.Context, userID uuid.UUID, input SavingInput) (*model.Saving, error) {
	saving := &model.Saving{
		UserID:      userID,
		Name:        input.Name,
		Type:        input.Type,
		Amount:      input.Amount,
		Currency:    input.Currency,
		Description: input.Description,
	}
	if err := s.repo.Create(ctx, saving); err != nil {
		return nil, err
	}
	return saving, nil
}

func (s *SavingService) Update(ctx context.Context, userID, id uuid.UUID, input SavingInput) (*model.Saving, error) {
	saving, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSavingNotFound
		}
		return nil, err
	}
	if saving.UserID != userID {
		return nil, errors.New("no autorizado")
	}

	saving.Name = input.Name
	saving.Type = input.Type
	saving.Amount = input.Amount
	saving.Currency = input.Currency
	saving.Description = input.Description

	if err := s.repo.Update(ctx, saving); err != nil {
		return nil, err
	}
	return saving, nil
}

func (s *SavingService) Delete(ctx context.Context, userID, id uuid.UUID) error {
	saving, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrSavingNotFound
		}
		return err
	}
	if saving.UserID != userID {
		return errors.New("no autorizado")
	}
	return s.repo.Delete(ctx, id)
}

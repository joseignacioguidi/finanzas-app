package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
)

type TransactionService struct {
	repo repository.TransactionRepository
}

func NewTransactionService(repo repository.TransactionRepository) *TransactionService {
	return &TransactionService{repo: repo}
}

type TransactionInput struct {
	CategoryID  string  `json:"category_id"  binding:"required"`
	Type        string  `json:"type"         binding:"required,oneof=income expense"`
	Amount      float64 `json:"amount"       binding:"required,gt=0"`
	Currency    string  `json:"currency"     binding:"required,len=3"`
	Description string  `json:"description"`
	Date        string  `json:"date"         binding:"required"`
}

func (s *TransactionService) GetAll(ctx context.Context, userID uuid.UUID, filter repository.TransactionFilter) ([]model.Transaction, error) {
	return s.repo.FindAll(ctx, userID, filter)
}

func (s *TransactionService) Create(ctx context.Context, userID uuid.UUID, input TransactionInput) (*model.Transaction, error) {
	catID, err := uuid.Parse(input.CategoryID)
	if err != nil {
		return nil, errors.New("category_id inválido")
	}

	t, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return nil, errors.New("fecha inválida, formato esperado: YYYY-MM-DD")
	}

	tx := &model.Transaction{
		UserID:      userID,
		CategoryID:  catID,
		Type:        model.TransactionType(input.Type),
		Amount:      input.Amount,
		Currency:    input.Currency,
		Description: input.Description,
		Date:        model.Date{Time: t},
	}

	if err := s.repo.Create(ctx, tx); err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *TransactionService) Update(ctx context.Context, userID uuid.UUID, id uuid.UUID, input TransactionInput) (*model.Transaction, error) {
	tx, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if tx.UserID != userID {
		return nil, errors.New("no autorizado")
	}

	catID, err := uuid.Parse(input.CategoryID)
	if err != nil {
		return nil, errors.New("category_id inválido")
	}

	t2, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return nil, errors.New("fecha inválida, formato esperado: YYYY-MM-DD")
	}

	tx.CategoryID = catID
	tx.Type = model.TransactionType(input.Type)
	tx.Amount = input.Amount
	tx.Currency = input.Currency
	tx.Description = input.Description
	tx.Date = model.Date{Time: t2}

	if err := s.repo.Update(ctx, tx); err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *TransactionService) Delete(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	tx, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if tx.UserID != userID {
		return errors.New("no autorizado")
	}
	return s.repo.Delete(ctx, id)
}

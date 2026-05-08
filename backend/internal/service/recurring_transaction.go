package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
)

type RecurringTransactionService struct {
	repo   repository.RecurringTransactionRepository
	txRepo repository.TransactionRepository
}

func NewRecurringTransactionService(repo repository.RecurringTransactionRepository, txRepo repository.TransactionRepository) *RecurringTransactionService {
	return &RecurringTransactionService{repo: repo, txRepo: txRepo}
}

type RecurringTransactionInput struct {
	CategoryID  string  `json:"category_id"  binding:"required"`
	Type        string  `json:"type"         binding:"required,oneof=income expense"`
	Amount      float64 `json:"amount"       binding:"required,gt=0"`
	Currency    string  `json:"currency"     binding:"required,len=3"`
	Description string  `json:"description"`
	Date        string  `json:"date"         binding:"required"` // "2006-01-02"
}

func (s *RecurringTransactionService) GetAll(ctx context.Context, userID uuid.UUID) ([]model.RecurringTransaction, error) {
	return s.repo.FindAll(ctx, userID)
}

// Create guarda la plantilla y genera todas las ocurrencias hasta fin del año próximo.
// La ocurrencia de cada mes usa el mismo día que la fecha inicial, ajustado al último
// día del mes si ese mes tiene menos días (ej: día 31 en febrero → 28/29).
func (s *RecurringTransactionService) Create(ctx context.Context, userID uuid.UUID, input RecurringTransactionInput) (*model.RecurringTransaction, error) {
	catID, err := uuid.Parse(input.CategoryID)
	if err != nil {
		return nil, errors.New("category_id inválido")
	}

	startDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return nil, errors.New("fecha inválida, formato esperado: YYYY-MM-DD")
	}

	rt := &model.RecurringTransaction{
		UserID:      userID,
		CategoryID:  catID,
		Type:        model.TransactionType(input.Type),
		Amount:      input.Amount,
		Currency:    input.Currency,
		Description: input.Description,
		DayOfMonth:  startDate.Day(),
		Active:      true,
	}

	if err := s.repo.Create(ctx, rt); err != nil {
		return nil, err
	}

	today := time.Now()
	endDate := time.Date(today.Year()+1, time.December, 1, 0, 0, 0, 0, time.UTC)

	current := time.Date(startDate.Year(), startDate.Month(), 1, 0, 0, 0, 0, time.UTC)
	for !current.After(endDate) {
		date := clampDay(current.Year(), current.Month(), rt.DayOfMonth)

		status := model.TransactionStatusConfirmed
		if date.After(today) {
			status = model.TransactionStatusPending
		}

		tx := &model.Transaction{
			UserID:       userID,
			CategoryID:   catID,
			Type:         rt.Type,
			Amount:       rt.Amount,
			Currency:     rt.Currency,
			ExchangeRate: 1,
			BaseAmount:   rt.Amount,
			Description:  rt.Description,
			Date:         model.Date{Time: date},
			Status:       status,
			RecurringID:  &rt.ID,
		}
		if err := s.txRepo.Create(ctx, tx); err != nil {
			return nil, err
		}

		current = current.AddDate(0, 1, 0)
	}

	return rt, nil
}

// Deactivate marca la plantilla como inactiva y elimina todas las ocurrencias pendientes.
// Las transacciones ya confirmadas se conservan.
func (s *RecurringTransactionService) Deactivate(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	rt, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if rt.UserID != userID {
		return errors.New("no autorizado")
	}

	if err := s.repo.Deactivate(ctx, id); err != nil {
		return err
	}

	return s.txRepo.DeletePendingByRecurringID(ctx, id)
}

// clampDay retorna el día ajustado al último día del mes si excede sus días disponibles.
func clampDay(year int, month time.Month, day int) time.Time {
	lastDay := time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()
	if day > lastDay {
		day = lastDay
	}
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}

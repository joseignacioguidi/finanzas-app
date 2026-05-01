package service

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
)

type TransactionService struct {
	repo    repository.TransactionRepository
	catRepo repository.CategoryRepository
}

func NewTransactionService(repo repository.TransactionRepository, catRepo repository.CategoryRepository) *TransactionService {
	return &TransactionService{repo: repo, catRepo: catRepo}
}

type ImportResult struct {
	Imported int      `json:"imported"`
	Skipped  []string `json:"skipped"`
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

// ImportCSV parsea el CSV exportado y crea las transacciones que no fallen.
// Columnas esperadas: ID,Fecha,Descripción,Categoría,Tipo,Monto,Moneda,Estado
func (s *TransactionService) ImportCSV(ctx context.Context, userID uuid.UUID, r io.Reader) (*ImportResult, error) {
	reader := csv.NewReader(r)
	reader.LazyQuotes = true

	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("error leyendo CSV: %w", err)
	}

	if len(records) < 2 {
		return &ImportResult{Imported: 0, Skipped: []string{}}, nil
	}

	result := &ImportResult{Skipped: []string{}}

	for i, row := range records[1:] {
		lineNum := i + 2
		if len(row) < 8 {
			result.Skipped = append(result.Skipped, fmt.Sprintf("fila %d: columnas insuficientes", lineNum))
			continue
		}

		date, err := time.Parse("2006-01-02", row[1])
		if err != nil {
			result.Skipped = append(result.Skipped, fmt.Sprintf("fila %d: fecha inválida '%s'", lineNum, row[1]))
			continue
		}

		amount, err := strconv.ParseFloat(row[5], 64)
		if err != nil || amount <= 0 {
			result.Skipped = append(result.Skipped, fmt.Sprintf("fila %d: monto inválido '%s'", lineNum, row[5]))
			continue
		}

		catName := row[3]
		cat, err := s.catRepo.FindByName(ctx, userID, catName)
		if err != nil {
			result.Skipped = append(result.Skipped, fmt.Sprintf("fila %d: categoría '%s' no encontrada", lineNum, catName))
			continue
		}

		txType := model.TransactionTypeExpense
		if cat.Type == model.CategoryTypeIncome {
			txType = model.TransactionTypeIncome
		}

		status := model.TransactionStatus(row[7])
		if status != model.TransactionStatusConfirmed && status != model.TransactionStatusPending {
			status = model.TransactionStatusConfirmed
		}

		currency := row[6]
		if len(currency) != 3 {
			currency = "ARS"
		}

		tx := &model.Transaction{
			UserID:      userID,
			CategoryID:  cat.ID,
			Type:        txType,
			Amount:      amount,
			Currency:    currency,
			Description: row[2],
			Date:        model.Date{Time: date},
			Status:      status,
		}

		if err := s.repo.Create(ctx, tx); err != nil {
			result.Skipped = append(result.Skipped, fmt.Sprintf("fila %d: error al guardar (%s)", lineNum, err.Error()))
			continue
		}

		result.Imported++
	}

	return result, nil
}

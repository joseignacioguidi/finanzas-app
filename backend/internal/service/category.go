package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
)

var ErrCategoryHasTransactions = errors.New("no se puede eliminar una categoría con transacciones asociadas")

type CategoryService struct {
	repo   repository.CategoryRepository
	txRepo repository.TransactionRepository
}

func NewCategoryService(repo repository.CategoryRepository, txRepo repository.TransactionRepository) *CategoryService {
	return &CategoryService{repo: repo, txRepo: txRepo}
}

type CategoryInput struct {
	Name  string `json:"name"  binding:"required"`
	Color string `json:"color" binding:"required,len=7"`
	Icon  string `json:"icon"  binding:"omitempty,max=50"`
}

func (s *CategoryService) GetAll(ctx context.Context, userID uuid.UUID) ([]model.Category, error) {
	return s.repo.FindAll(ctx, userID)
}

func (s *CategoryService) Create(ctx context.Context, userID uuid.UUID, input CategoryInput) (*model.Category, error) {
	cat := &model.Category{
		UserID: userID,
		Name:   input.Name,
		Color:  input.Color,
		Icon:   input.Icon,
	}
	if err := s.repo.Create(ctx, cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) Update(ctx context.Context, userID uuid.UUID, id uuid.UUID, input CategoryInput) (*model.Category, error) {
	cat, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if cat.UserID != userID {
		return nil, errors.New("no autorizado")
	}
	cat.Name = input.Name
	cat.Color = input.Color
	cat.Icon = input.Icon
	if err := s.repo.Update(ctx, cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) Delete(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	cat, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if cat.UserID != userID {
		return errors.New("no autorizado")
	}
	count, err := s.txRepo.CountByCategory(ctx, id)
	if err != nil {
		return err
	}
	if count > 0 {
		return ErrCategoryHasTransactions
	}
	return s.repo.Delete(ctx, id)
}

var defaultCategories = []CategoryInput{
	{Name: "Alimentación", Color: "#F5A623", Icon: "Utensils"},
	{Name: "Transporte", Color: "#38BDF8", Icon: "Car"},
	{Name: "Salud", Color: "#F0516A", Icon: "HeartPulse"},
	{Name: "Vivienda", Color: "#10D9A0", Icon: "Home"},
	{Name: "Entretenimiento", Color: "#C084FC", Icon: "Film"},
}

func (s *CategoryService) SeedDefaultCategories(ctx context.Context, userID uuid.UUID) {
	for _, d := range defaultCategories {
		_, _ = s.Create(ctx, userID, d)
	}
}

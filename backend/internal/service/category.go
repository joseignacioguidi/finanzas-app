package service

import (
	"context"
	"errors"
	"time"

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
	Type  string `json:"type"  binding:"required,oneof=income expense savings investment"`
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
		Type:   model.CategoryType(input.Type),
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
	newType := model.CategoryType(input.Type)
	if cat.Type != newType {
		now := time.Now()
		cat.TypeChangedAt = &now
	}
	cat.Name = input.Name
	cat.Color = input.Color
	cat.Icon = input.Icon
	cat.Type = newType
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
	{Name: "Sueldo", Color: "#16A34A", Icon: "Banknote", Type: "income"},
	{Name: "Ingresos Varios", Color: "#059669", Icon: "DollarSign", Type: "income"},
	{Name: "Delivery", Color: "#F97316", Icon: "Bike", Type: "expense"},
	{Name: "Salud/Médicos", Color: "#EF4444", Icon: "Stethoscope", Type: "expense"},
	{Name: "Regalos", Color: "#EC4899", Icon: "Gift", Type: "expense"},
	{Name: "Mascotas", Color: "#84CC16", Icon: "PawPrint", Type: "expense"},
	{Name: "Impuestos", Color: "#6B7280", Icon: "Receipt", Type: "expense"},
	{Name: "Ropa", Color: "#A855F7", Icon: "Shirt", Type: "expense"},
	{Name: "Cuotas", Color: "#3B82F6", Icon: "CreditCard", Type: "expense"},
	{Name: "Inversiones", Color: "#10B981", Icon: "TrendingUp", Type: "investment"},
	{Name: "Entretenimiento", Color: "#8B5CF6", Icon: "Tv", Type: "expense"},
	{Name: "Comida/Supermercado", Color: "#F5A623", Icon: "ShoppingCart", Type: "expense"},
	{Name: "Salidas", Color: "#06B6D4", Icon: "Music", Type: "expense"},
	{Name: "Gastos Personales", Color: "#64748B", Icon: "User", Type: "expense"},
	{Name: "Deportes", Color: "#22C55E", Icon: "Dumbbell", Type: "expense"},
	{Name: "Fondo de Ahorro", Color: "#0EA5E9", Icon: "PiggyBank", Type: "savings"},
}

func (s *CategoryService) SeedDefaultCategories(ctx context.Context, userID uuid.UUID) {
	for _, d := range defaultCategories {
		_, _ = s.Create(ctx, userID, d)
	}
}

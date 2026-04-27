package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/model"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
)

type CategoryService struct {
	repo repository.CategoryRepository
}

func NewCategoryService(repo repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

type CategoryInput struct {
	Name  string `json:"name"  binding:"required"`
	Color string `json:"color" binding:"required,len=7"`
}

func (s *CategoryService) GetAll(ctx context.Context, userID uuid.UUID) ([]model.Category, error) {
	return s.repo.FindAll(ctx, userID)
}

func (s *CategoryService) Create(ctx context.Context, userID uuid.UUID, input CategoryInput) (*model.Category, error) {
	cat := &model.Category{
		UserID: userID,
		Name:   input.Name,
		Color:  input.Color,
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
	return s.repo.Delete(ctx, id)
}

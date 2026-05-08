package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/service"
)

type BudgetHandler struct {
	svc *service.BudgetService
}

func NewBudgetHandler(svc *service.BudgetService) *BudgetHandler {
	return &BudgetHandler{svc: svc}
}

func (h *BudgetHandler) GetMonthly(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	now := time.Now()
	month := now.Month()
	year := now.Year()

	if m := c.Query("month"); m != "" {
		v, err := strconv.Atoi(m)
		if err != nil || v < 1 || v > 12 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "month inválido"})
			return
		}
		month = time.Month(v)
	}
	if y := c.Query("year"); y != "" {
		v, err := strconv.Atoi(y)
		if err != nil || v < 2000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "year inválido"})
			return
		}
		year = v
	}

	results, err := h.svc.GetMonthly(c.Request.Context(), userID, int(month), year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, results)
}

func (h *BudgetHandler) Create(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var input service.BudgetInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	budget, err := h.svc.Create(c.Request.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrDuplicateBudget) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, budget)
}

func (h *BudgetHandler) Update(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var input service.BudgetUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	budget, err := h.svc.Update(c.Request.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrBudgetNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, budget)
}

func (h *BudgetHandler) Delete(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := h.svc.Delete(c.Request.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrBudgetNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

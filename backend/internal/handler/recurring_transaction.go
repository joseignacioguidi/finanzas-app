package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/service"
)

type RecurringTransactionHandler struct {
	svc *service.RecurringTransactionService
}

func NewRecurringTransactionHandler(svc *service.RecurringTransactionService) *RecurringTransactionHandler {
	return &RecurringTransactionHandler{svc: svc}
}

func (h *RecurringTransactionHandler) GetAll(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	rts, err := h.svc.GetAll(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rts)
}

func (h *RecurringTransactionHandler) Create(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	var input service.RecurringTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	rt, err := h.svc.Create(c.Request.Context(), userID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, rt)
}

func (h *RecurringTransactionHandler) Deactivate(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}
	if err := h.svc.Deactivate(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

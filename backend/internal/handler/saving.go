package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/service"
)

type SavingHandler struct {
	svc *service.SavingService
}

func NewSavingHandler(svc *service.SavingService) *SavingHandler {
	return &SavingHandler{svc: svc}
}

func (h *SavingHandler) GetAll(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	result, err := h.svc.GetAll(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *SavingHandler) Create(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var input service.SavingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	saving, err := h.svc.Create(c.Request.Context(), userID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, saving)
}

func (h *SavingHandler) Update(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var input service.SavingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	saving, err := h.svc.Update(c.Request.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrSavingNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, saving)
}

func (h *SavingHandler) Delete(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := h.svc.Delete(c.Request.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrSavingNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

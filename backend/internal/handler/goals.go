package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/service"
)

type GoalsHandler struct {
	svc *service.GoalsService
}

func NewGoalsHandler(svc *service.GoalsService) *GoalsHandler {
	return &GoalsHandler{svc: svc}
}

func (h *GoalsHandler) GetAll(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	goals, err := h.svc.GetAll(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, goals)
}

func (h *GoalsHandler) Create(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	var input service.GoalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	goal, err := h.svc.Create(c.Request.Context(), userID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, goal)
}

func (h *GoalsHandler) Update(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}
	var input service.GoalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	goal, err := h.svc.Update(c.Request.Context(), userID, id, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, goal)
}

func (h *GoalsHandler) Delete(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}
	if err := h.svc.Delete(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *GoalsHandler) EmergencyFund(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	result, err := h.svc.EmergencyFund(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

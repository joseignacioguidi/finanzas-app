package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joseguidi/expense-tracker/backend/internal/service"
)

type ExchangeRateHandler struct {
	svc *service.ExchangeRateService
}

func NewExchangeRateHandler(svc *service.ExchangeRateService) *ExchangeRateHandler {
	return &ExchangeRateHandler{svc: svc}
}

func (h *ExchangeRateHandler) GetRate(c *gin.Context) {
	from := c.Query("from")
	to := c.Query("to")
	if len(from) != 3 || len(to) != 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros 'from' y 'to' requeridos (3 caracteres)"})
		return
	}

	rate, fetchedAt, err := h.svc.GetRate(from, to)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"from":       from,
		"to":         to,
		"rate":       rate,
		"fetched_at": fetchedAt.UTC().Format("2006-01-02T15:04:05Z"),
	})
}

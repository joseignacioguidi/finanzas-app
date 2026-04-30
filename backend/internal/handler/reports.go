package handler

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joseguidi/expense-tracker/backend/internal/service"
)

type ReportsHandler struct {
	svc *service.ReportsService
}

func NewReportsHandler(svc *service.ReportsService) *ReportsHandler {
	return &ReportsHandler{svc: svc}
}

func (h *ReportsHandler) Summary(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	from, to := c.Query("from"), c.Query("to")
	if from == "" || to == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "los parámetros from y to son requeridos"})
		return
	}
	result, err := h.svc.Summary(c.Request.Context(), userID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ReportsHandler) ByCategory(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	from, to := c.Query("from"), c.Query("to")
	if from == "" || to == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "los parámetros from y to son requeridos"})
		return
	}
	result, err := h.svc.ByCategory(c.Request.Context(), userID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ReportsHandler) Monthly(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	year := time.Now().Year()
	if y, err := strconv.Atoi(c.Query("year")); err == nil {
		year = y
	}
	result, err := h.svc.Monthly(c.Request.Context(), userID, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ReportsHandler) TopTransactions(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	from, to := c.Query("from"), c.Query("to")
	if from == "" || to == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "los parámetros from y to son requeridos"})
		return
	}
	limit := 10
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 {
		limit = l
	}
	result, err := h.svc.TopTransactions(c.Request.Context(), userID, from, to, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ReportsHandler) Export(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	from, to := c.Query("from"), c.Query("to")
	if from == "" || to == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "los parámetros from y to son requeridos"})
		return
	}

	rows, err := h.svc.ExportTransactions(c.Request.Context(), userID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	_ = w.Write([]string{"ID", "Fecha", "Descripción", "Categoría", "Tipo", "Monto", "Moneda"})
	for _, r := range rows {
		_ = w.Write([]string{
			r.ID,
			r.Date,
			r.Description,
			r.CategoryName,
			r.CategoryType,
			strconv.FormatFloat(r.Amount, 'f', 2, 64),
			r.Currency,
		})
	}
	w.Flush()

	filename := fmt.Sprintf("transacciones_%s_%s.csv", from, to)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Data(http.StatusOK, "text/csv; charset=utf-8", buf.Bytes())
}

func (h *ReportsHandler) Savings(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	months := 12
	if m, err := strconv.Atoi(c.Query("months")); err == nil && m > 0 {
		months = m
	}
	result, err := h.svc.Savings(c.Request.Context(), userID, months)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ReportsHandler) Trends(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	months := 3
	if m, err := strconv.Atoi(c.Query("months")); err == nil && m > 0 {
		months = m
	}
	result, err := h.svc.Trends(c.Request.Context(), userID, months)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

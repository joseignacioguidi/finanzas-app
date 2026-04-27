package handler

import "github.com/gin-gonic/gin"

type TransactionHandler struct {
	// TODO: agregar TransactionService
}

func NewTransactionHandler() *TransactionHandler {
	return &TransactionHandler{}
}

func (h *TransactionHandler) GetAll(c *gin.Context) {
	// TODO: listar transacciones con filtros (mes, tipo, categoría)
}

func (h *TransactionHandler) Create(c *gin.Context) {
	// TODO: crear nueva transacción
}

func (h *TransactionHandler) Update(c *gin.Context) {
	// TODO: editar transacción por ID
}

func (h *TransactionHandler) Delete(c *gin.Context) {
	// TODO: eliminar transacción por ID
}

package handler

import "github.com/gin-gonic/gin"

type CategoryHandler struct {
	// TODO: agregar CategoryService
}

func NewCategoryHandler() *CategoryHandler {
	return &CategoryHandler{}
}

func (h *CategoryHandler) GetAll(c *gin.Context) {
	// TODO: listar categorías del usuario autenticado
}

func (h *CategoryHandler) Create(c *gin.Context) {
	// TODO: crear nueva categoría
}

func (h *CategoryHandler) Update(c *gin.Context) {
	// TODO: actualizar categoría por ID
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	// TODO: eliminar categoría (verificar que no tenga transacciones)
}

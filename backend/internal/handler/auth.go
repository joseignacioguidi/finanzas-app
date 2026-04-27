package handler

import "github.com/gin-gonic/gin"

type AuthHandler struct {
	// TODO: agregar AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

func (h *AuthHandler) Register(c *gin.Context) {
	// TODO: implementar registro de usuario
}

func (h *AuthHandler) Login(c *gin.Context) {
	// TODO: implementar login y emisión de JWT
}

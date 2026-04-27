package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env encontrado, usando variables de entorno del sistema")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	log.Printf("servidor iniciando en :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("error iniciando servidor: %v", err)
	}
}

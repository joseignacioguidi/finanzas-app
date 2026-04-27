package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/joseguidi/expense-tracker/backend/internal/db"
	"github.com/joseguidi/expense-tracker/backend/internal/handler"
	"github.com/joseguidi/expense-tracker/backend/internal/middleware"
	"github.com/joseguidi/expense-tracker/backend/internal/repository"
	"github.com/joseguidi/expense-tracker/backend/internal/service"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env encontrado, usando variables de entorno del sistema")
	}

	database := db.Connect()

	// Repositories
	userRepo := repository.NewUserRepository(database)
	catRepo := repository.NewCategoryRepository(database)
	txRepo := repository.NewTransactionRepository(database)

	// Services
	authSvc := service.NewAuthService(userRepo)
	catSvc := service.NewCategoryService(catRepo)
	txSvc := service.NewTransactionService(txRepo)
	statsSvc := service.NewStatsService(txRepo)

	// Handlers
	authH := handler.NewAuthHandler(authSvc)
	catH := handler.NewCategoryHandler(catSvc)
	txH := handler.NewTransactionHandler(txSvc)
	statsH := handler.NewStatsHandler(statsSvc)

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authH.Register)
			auth.POST("/login", authH.Login)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthRequired())
		{
			protected.GET("/transactions", txH.GetAll)
			protected.POST("/transactions", txH.Create)
			protected.PUT("/transactions/:id", txH.Update)
			protected.DELETE("/transactions/:id", txH.Delete)

			protected.GET("/categories", catH.GetAll)
			protected.POST("/categories", catH.Create)
			protected.PUT("/categories/:id", catH.Update)
			protected.DELETE("/categories/:id", catH.Delete)

			stats := protected.Group("/stats")
			{
				stats.GET("/monthly", statsH.Monthly)
				stats.GET("/categories", statsH.Categories)
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("servidor iniciando en :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("error iniciando servidor: %v", err)
	}
}

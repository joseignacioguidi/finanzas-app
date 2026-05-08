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
	recurringRepo := repository.NewRecurringTransactionRepository(database)
	reportsRepo := repository.NewReportsRepository(database)
	goalRepo := repository.NewGoalRepository(database)
	budgetRepo := repository.NewBudgetRepository(database)

	// Services
	catSvc := service.NewCategoryService(catRepo, txRepo)
	authSvc := service.NewAuthService(userRepo, catSvc)
	txSvc := service.NewTransactionService(txRepo, catRepo)
	statsSvc := service.NewStatsService(txRepo)
	recurringSvc := service.NewRecurringTransactionService(recurringRepo, txRepo)
	reportsSvc := service.NewReportsService(reportsRepo)
	goalsSvc := service.NewGoalsService(goalRepo, reportsRepo)
	budgetSvc := service.NewBudgetService(budgetRepo, catRepo)

	// Handlers
	authH := handler.NewAuthHandler(authSvc)
	catH := handler.NewCategoryHandler(catSvc)
	txH := handler.NewTransactionHandler(txSvc)
	statsH := handler.NewStatsHandler(statsSvc)
	recurringH := handler.NewRecurringTransactionHandler(recurringSvc)
	reportsH := handler.NewReportsHandler(reportsSvc)
	goalsH := handler.NewGoalsHandler(goalsSvc)
	budgetH := handler.NewBudgetHandler(budgetSvc)

	r := gin.Default()

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", frontendURL)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

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
			protected.POST("/transactions/import", txH.Import)
			protected.PUT("/transactions/:id", txH.Update)
			protected.DELETE("/transactions/:id", txH.Delete)

			protected.GET("/recurring", recurringH.GetAll)
			protected.POST("/recurring", recurringH.Create)
			protected.DELETE("/recurring/:id", recurringH.Deactivate)

			protected.GET("/categories", catH.GetAll)
			protected.POST("/categories", catH.Create)
			protected.PUT("/categories/:id", catH.Update)
			protected.DELETE("/categories/:id", catH.Delete)

			stats := protected.Group("/stats")
			{
				stats.GET("/monthly", statsH.Monthly)
				stats.GET("/categories", statsH.Categories)
			}

			reports := protected.Group("/reports")
			{
				reports.GET("/summary", reportsH.Summary)
				reports.GET("/by-category", reportsH.ByCategory)
				reports.GET("/monthly", reportsH.Monthly)
				reports.GET("/top-transactions", reportsH.TopTransactions)
				reports.GET("/export", reportsH.Export)
			}

			analysis := protected.Group("/analysis")
			{
				analysis.GET("/savings", reportsH.Savings)
				analysis.GET("/trends", reportsH.Trends)
			}

			goals := protected.Group("/goals")
			{
				goals.GET("/emergency-fund", goalsH.EmergencyFund)
				goals.GET("", goalsH.GetAll)
				goals.POST("", goalsH.Create)
				goals.PUT("/:id", goalsH.Update)
				goals.DELETE("/:id", goalsH.Delete)
			}

			budgets := protected.Group("/budgets")
			{
				budgets.GET("", budgetH.GetMonthly)
				budgets.POST("", budgetH.Create)
				budgets.PUT("/:id", budgetH.Update)
				budgets.DELETE("/:id", budgetH.Delete)
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

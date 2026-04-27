---
name: rest-api-patterns
description: >
  Patrones de diseño para la API REST del proyecto expense-tracker (Go + Gin).
  Usar siempre que se cree o modifique un endpoint, se defina un handler,
  se manejen errores HTTP, se estructuren responses, o se trabaje con
  autenticación JWT. Activar también cuando el usuario pregunte sobre
  status codes, validaciones, middlewares, o estructura de requests/responses.
---

# Patrones de API REST — Expense Tracker (Go + Gin)

## Estructura de un handler

Todos los handlers siguen este patrón. Sin excepciones:

```go
func (h *TransactionHandler) Create(c *gin.Context) {
    // 1. Extraer userID del contexto (seteado por el middleware de auth)
    userID := c.MustGet("userID").(uuid.UUID)

    // 2. Parsear y validar el body
    var req CreateTransactionRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, ErrorResponse(err.Error()))
        return
    }

    // 3. Llamar al service
    tx, err := h.service.Create(c.Request.Context(), userID, req)
    if err != nil {
        handleServiceError(c, err)
        return
    }

    // 4. Responder
    c.JSON(http.StatusCreated, tx)
}
```

## Formato de responses

### Éxito con datos
```json
{ "id": "uuid", "amount": 1500.00, "currency": "ARS" }
```
O array directo:
```json
[{ "id": "uuid" }, { "id": "uuid" }]
```

### Error
Siempre usar esta estructura para errores:
```go
type APIError struct {
    Error   string `json:"error"`
    Message string `json:"message,omitempty"`
}

func ErrorResponse(msg string) APIError {
    return APIError{Error: msg}
}
```

```json
{ "error": "transaction not found" }
```

### Paginación (cuando aplique)
```json
{
  "data": [...],
  "total": 45,
  "page": 1,
  "per_page": 20
}
```

## Status codes

| Situación | Código |
|---|---|
| GET exitoso con datos | 200 |
| POST exitoso (creación) | 201 |
| DELETE exitoso | 204 (sin body) |
| Body inválido / falta campo | 400 |
| Token ausente o inválido | 401 |
| Recurso de otro usuario | 403 |
| Recurso no encontrado | 404 |
| Error interno del servidor | 500 |

## Requests con validación

Usar `binding:"required"` de Gin para validar campos obligatorios:

```go
type CreateTransactionRequest struct {
    Amount      float64         `json:"amount"       binding:"required,gt=0"`
    Currency    string          `json:"currency"     binding:"required,len=3"`
    Type        TransactionType `json:"type"         binding:"required,oneof=income expense"`
    CategoryID  uuid.UUID       `json:"category_id"  binding:"required"`
    Date        time.Time       `json:"date"         binding:"required"`
    Description string          `json:"description"`
}
```

## Rutas con Gin

Agrupar por recurso con prefijo `/api`. Auth en middleware de grupo:

```go
func SetupRoutes(r *gin.Engine, h *Handlers, authMiddleware gin.HandlerFunc) {
    api := r.Group("/api")

    // Rutas públicas
    api.POST("/auth/register", h.Auth.Register)
    api.POST("/auth/login",    h.Auth.Login)

    // Rutas protegidas
    protected := api.Group("/")
    protected.Use(authMiddleware)
    {
        protected.GET("/transactions",     h.Transaction.GetAll)
        protected.POST("/transactions",    h.Transaction.Create)
        protected.PUT("/transactions/:id", h.Transaction.Update)
        protected.DELETE("/transactions/:id", h.Transaction.Delete)

        protected.GET("/categories",        h.Category.GetAll)
        protected.POST("/categories",       h.Category.Create)
        protected.PUT("/categories/:id",    h.Category.Update)
        protected.DELETE("/categories/:id", h.Category.Delete)

        protected.GET("/stats/monthly",    h.Stats.Monthly)
        protected.GET("/stats/categories", h.Stats.ByCategory)
    }
}
```

## Middleware de autenticación JWT

El middleware valida el token y setea el `userID` en el contexto de Gin:

```go
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenStr := c.GetHeader("Authorization")
        if tokenStr == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized,
                ErrorResponse("missing authorization header"))
            return
        }

        // Remover "Bearer "
        tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")

        userID, err := parseJWT(tokenStr, jwtSecret)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized,
                ErrorResponse("invalid token"))
            return
        }

        c.Set("userID", userID)
        c.Next()
    }
}
```

En los handlers, obtener el userID así:
```go
userID := c.MustGet("userID").(uuid.UUID)
```

## Manejo centralizado de errores de service

Definir errores de dominio en el service y mapearlos a HTTP en el handler:

```go
// internal/service/errors.go
var (
    ErrNotFound    = errors.New("not found")
    ErrForbidden   = errors.New("forbidden")
    ErrBadRequest  = errors.New("bad request")
)

// En el handler — función auxiliar
func handleServiceError(c *gin.Context, err error) {
    switch {
    case errors.Is(err, service.ErrNotFound):
        c.JSON(http.StatusNotFound, ErrorResponse(err.Error()))
    case errors.Is(err, service.ErrForbidden):
        c.JSON(http.StatusForbidden, ErrorResponse(err.Error()))
    case errors.Is(err, service.ErrBadRequest):
        c.JSON(http.StatusBadRequest, ErrorResponse(err.Error()))
    default:
        c.JSON(http.StatusInternalServerError, ErrorResponse("internal server error"))
    }
}
```

## Ownership — seguridad multi-usuario

Siempre verificar que el recurso pertenece al usuario autenticado.
Nunca confiar solo en el ID del parámetro de URL:

```go
func (s *TransactionService) GetByID(ctx context.Context, userID, txID uuid.UUID) (*model.Transaction, error) {
    tx, err := s.repo.FindByID(ctx, txID)
    if err != nil {
        return nil, ErrNotFound
    }

    // Verificación de ownership
    if tx.UserID != userID {
        return nil, ErrForbidden
    }

    return tx, nil
}
```

## Filtros en GET con query params

Bindear query params a un struct de filtro:

```go
type TransactionFilter struct {
    Month      string `form:"month"`       // "2026-04"
    Type       string `form:"type"`        // "income" | "expense"
    CategoryID string `form:"category_id"`
}

func (h *TransactionHandler) GetAll(c *gin.Context) {
    userID := c.MustGet("userID").(uuid.UUID)

    var filter TransactionFilter
    if err := c.ShouldBindQuery(&filter); err != nil {
        c.JSON(http.StatusBadRequest, ErrorResponse(err.Error()))
        return
    }

    txs, err := h.service.GetAll(c.Request.Context(), userID, filter)
    // ...
}
```

## CORS

Configurar en `main.go` antes de las rutas:

```go
r.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"https://tu-app.vercel.app", "http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: true,
}))
```
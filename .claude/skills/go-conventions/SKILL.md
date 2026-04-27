---
name: go-conventions
description: >
  Convenciones de Go para el proyecto expense-tracker. Usar siempre que se escriba,
  revise o refactorice código Go en el backend. Aplica a handlers, services,
  repositories, models y cualquier archivo .go del proyecto. Activar también
  cuando el usuario pregunte "cómo hago X en Go", pida revisar código Go,
  o mencione errores, structs, interfaces, o patrones del lenguaje.
---

# Convenciones de Go — Expense Tracker

El desarrollador viene de NestJS y está aprendiendo Go. Priorizar ejemplos
explícitos sobre abstracciones. Evitar "magia". Cada patrón debe quedar claro
de leer.

## Arquitectura de capas

Siempre respetar este flujo. Nunca saltear capas:

```
handler → service → repository
```

- **handler**: solo maneja HTTP. Parsea el request, llama al service, devuelve JSON.
- **service**: lógica de negocio. No sabe nada de HTTP ni de SQL.
- **repository**: solo habla con la base de datos. Devuelve modelos o errores.

## Manejo de errores

Go no tiene excepciones. Cada función que puede fallar devuelve `(T, error)`.
Siempre chequear el error inmediatamente después de la llamada:

```go
// CORRECTO
user, err := r.userRepo.FindByID(ctx, id)
if err != nil {
    return nil, fmt.Errorf("FindByID: %w", err)
}

// INCORRECTO — nunca ignorar el error
user, _ := r.userRepo.FindByID(ctx, id)
```

Usar `fmt.Errorf("contexto: %w", err)` para envolver errores y mantener el stack.

## Structs y modelos

Definir todos los modelos en `internal/model/`. Usar tags de GORM y JSON juntos:

```go
type Transaction struct {
    ID          uuid.UUID        `gorm:"type:uuid;primaryKey" json:"id"`
    UserID      uuid.UUID        `gorm:"type:uuid;not null"   json:"user_id"`
    Amount      float64          `gorm:"not null"             json:"amount"`
    Currency    string           `gorm:"size:3;not null"      json:"currency"`
    Type        TransactionType  `gorm:"not null"             json:"type"`
    CategoryID  uuid.UUID        `gorm:"type:uuid"            json:"category_id"`
    Description string           `gorm:"size:255"             json:"description"`
    Date        time.Time        `gorm:"not null"             json:"date"`
    CreatedAt   time.Time        `json:"created_at"`
    UpdatedAt   time.Time        `json:"updated_at"`
}
```

Usar `type TransactionType string` con constantes para campos enum:

```go
type TransactionType string

const (
    TransactionTypeIncome  TransactionType = "income"
    TransactionTypeExpense TransactionType = "expense"
)
```

## Interfaces en repositories

Definir una interfaz para cada repository. Facilita testing y desacople:

```go
// internal/repository/transaction.go
type TransactionRepository interface {
    FindAll(ctx context.Context, filter TransactionFilter) ([]model.Transaction, error)
    FindByID(ctx context.Context, id uuid.UUID) (*model.Transaction, error)
    Create(ctx context.Context, tx *model.Transaction) error
    Update(ctx context.Context, tx *model.Transaction) error
    Delete(ctx context.Context, id uuid.UUID) error
}
```

## Inyección de dependencias

Go no tiene DI container. Se hace manual en `main.go` o en una función `Setup()`:

```go
// cmd/main.go
db := database.Connect()

txRepo    := repository.NewTransactionRepository(db)
txService := service.NewTransactionService(txRepo)
txHandler := handler.NewTransactionHandler(txService)
```

Cada constructor recibe sus dependencias como parámetros:

```go
func NewTransactionService(repo repository.TransactionRepository) *TransactionService {
    return &TransactionService{repo: repo}
}
```

## Contexto (context.Context)

Pasar `ctx context.Context` como **primer parámetro** en todas las funciones
que llamen a la DB o servicios externos:

```go
func (s *TransactionService) GetAll(ctx context.Context, userID uuid.UUID) ([]model.Transaction, error)
func (r *transactionRepo) FindAll(ctx context.Context, filter TransactionFilter) ([]model.Transaction, error)
```

## Naming

- Archivos: `snake_case.go` — `transaction_handler.go`
- Structs y tipos: `PascalCase` — `TransactionService`
- Variables y funciones: `camelCase` — `getUserByID`
- Constantes: `PascalCase` — `TransactionTypeIncome`
- Interfaces: nombre descriptivo, no agregar `I` al principio — `TransactionRepository` no `ITransactionRepository`
- Receptores de métodos: una o dos letras del tipo — `func (s *TransactionService)` no `func (service *TransactionService)`

## Estructura de archivos

Cada capa tiene su propio archivo por entidad:

```
internal/
├── handler/
│   ├── transaction.go   ← TransactionHandler
│   ├── category.go      ← CategoryHandler
│   └── auth.go          ← AuthHandler
├── service/
│   ├── transaction.go   ← TransactionService
│   ├── category.go
│   └── auth.go
├── repository/
│   ├── transaction.go   ← interface + implementación
│   └── category.go
└── model/
    ├── transaction.go
    ├── category.go
    └── user.go
```

## GORM

Usar `db.WithContext(ctx)` siempre. Nunca usar `db` directamente sin contexto:

```go
// CORRECTO
result := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&transactions)

// INCORRECTO
result := r.db.Where("user_id = ?", userID).Find(&transactions)
```

Para errores de "not found", chequear con `errors.Is(result.Error, gorm.ErrRecordNotFound)`.

## Variables de entorno

Usar una struct de configuración cargada al inicio, nunca `os.Getenv()` esparcido:

```go
type Config struct {
    Port        string
    DatabaseURL string
    JWTSecret   string
}

func LoadConfig() (*Config, error) {
    return &Config{
        Port:        os.Getenv("PORT"),
        DatabaseURL: os.Getenv("DATABASE_URL"),
        JWTSecret:   os.Getenv("JWT_SECRET"),
    }, nil
}
```
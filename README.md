# Finanzas App

App de control de gastos personales. Monorepo con backend en Go + Gin y frontend en Next.js.

---

## Stack tecnológico

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Go | 1.23 | Lenguaje principal |
| Gin | v1.10.0 | Framework HTTP |
| GORM | v1.25.12 | ORM |
| PostgreSQL | 16 | Base de datos |
| golang-jwt/jwt | v5.3.1 | Autenticación JWT |
| google/uuid | v1.6.0 | Generación de IDs |
| godotenv | v1.5.1 | Variables de entorno |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.2.4 | Framework React (App Router) |
| React | 19.2.4 | UI |
| TypeScript | v5 | Tipado estático |
| Tailwind CSS | v4 | Estilos |
| Recharts | v3.8.1 | Gráficos |
| Lucide React | v1.11.0 | Iconos |

### Infraestructura
- **Base de datos:** PostgreSQL 16 (Docker)
- **ORM Migrations:** AutoMigrate de GORM

---

## Arquitectura

```
finanzas-app/
├── backend/
│   ├── cmd/main.go              # Entry point y setup de rutas
│   └── internal/
│       ├── handler/             # Capa HTTP (recibe requests, devuelve responses)
│       ├── service/             # Lógica de negocio
│       ├── repository/          # Acceso a datos (GORM)
│       ├── model/               # Modelos de base de datos
│       ├── middleware/          # JWT auth middleware
│       └── db/                  # Conexión y configuración de GORM
├── frontend/
│   ├── app/                     # Páginas (Next.js App Router)
│   ├── components/              # Componentes React reutilizables
│   └── lib/                     # API client, tipos, contexto de auth
├── bruno/                       # Colección de requests para testing
├── docs/                        # Wireframes y archivos de ejemplo
└── docker-compose.yml
```

El backend sigue el patrón **Handler → Service → Repository** en todas las rutas.

---

## Funcionalidades implementadas

### Autenticación
- Registro de usuario con email y contraseña
- Login con generación de JWT
- Rutas protegidas por middleware JWT
- Gestión de sesión con Context API en el frontend

### Transacciones
- Crear, editar y eliminar transacciones (ingresos y gastos)
- Filtrado por mes, año, tipo, categoría y estado (confirmada/pendiente)
- Importar transacciones desde CSV
- Exportar transacciones a CSV con filtros opcionales
- Soporte para transacciones recurrentes (por día del mes)

### Categorías
- Crear, editar y eliminar categorías
- Tipos: `income`, `expense`, `savings`, `investment`
- Personalización con color e icono

### Dashboard y Estadísticas
- Selector de mes para visualizar datos del período
- Tarjetas de resumen: ingresos, gastos, balance
- Gráfico de barras: ingresos vs. gastos de los últimos 6 meses
- Gráfico de donut: distribución de gastos por categoría
- Últimas 4 transacciones del mes

### Reportes
- Resumen por rango de fechas
- Desglose de gastos/ingresos por categoría
- Resumen mensual anual
- Top transacciones del período

### Análisis financiero
- Análisis de ahorro con proyecciones a 6 y 12 meses
- Análisis de tendencias de gasto por categoría
- Cálculo de fondo de emergencia recomendado

### Metas financieras
- Crear, editar y eliminar metas con monto objetivo y fecha límite

---

## API — Endpoints

Todos los endpoints excepto `/health` y `/api/auth/*` requieren header `Authorization: Bearer <token>`.

### Auth
```
POST /api/auth/register
POST /api/auth/login
```

### Transacciones
```
GET    /api/transactions          ?month=&year=&type=&category=&status=
POST   /api/transactions
POST   /api/transactions/import   (multipart/form-data, campo: file)
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

### Transacciones recurrentes
```
GET    /api/recurring
POST   /api/recurring
DELETE /api/recurring/:id        (desactiva, no elimina)
```

### Categorías
```
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

### Estadísticas
```
GET /api/stats/monthly            Ingresos/gastos últimos 6 meses
GET /api/stats/categories         Gastos por categoría
```

### Reportes
```
GET /api/reports/summary          ?from=YYYY-MM-DD&to=YYYY-MM-DD
GET /api/reports/by-category      ?from=&to=
GET /api/reports/monthly          ?year=YYYY
GET /api/reports/top-transactions ?from=&to=&limit=10
GET /api/reports/export           ?from=&to=
```

### Análisis
```
GET /api/analysis/savings         ?months=12
GET /api/analysis/trends          ?months=3
```

### Metas
```
GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id
GET    /api/goals/emergency-fund
```

### Health
```
GET /health
```

---

## Modelo de datos

```
Users
  id (UUID) · email · password_hash · created_at · updated_at

Categories
  id (UUID) · user_id · name · color · icon · type · created_at · updated_at

Transactions
  id (UUID) · user_id · category_id · type · amount · currency
  description · date · status · recurring_id · created_at · updated_at

RecurringTransactions
  id (UUID) · user_id · category_id · type · amount · currency
  description · day_of_month · active · created_at · updated_at

Goals
  id (UUID) · user_id · name · target_amount · target_date · created_at · updated_at
```

---

## Setup local

### Requisitos
- Go 1.23+
- Node.js 20+
- Docker y Docker Compose

### 1. Base de datos
```bash
docker compose up -d
```
Levanta PostgreSQL 16 en el puerto `5462`.

### 2. Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus valores
go run ./cmd/main.go
```
Corre en `http://localhost:8080`.

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8080
npm install
npm run dev
```
Corre en `http://localhost:3000`.

---

## Variables de entorno

### Backend (`.env`)
```
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5462/finanzas?sslmode=disable
JWT_SECRET=cambia-esto-por-un-secreto-largo-y-aleatorio
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Convenciones del proyecto
- Código en inglés, comentarios y commits en español
- Backend: patrón Handler → Service → Repository
- Frontend: componentes en PascalCase, lógica de API centralizada en `lib/api.ts`

# Expense Tracker — Contexto del Proyecto

App de control de gastos personales. Monorepo con backend en Go + Gin y frontend en Next.js.

---

## Stack tecnológico

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| Go | 1.23 | Lenguaje |
| Gin | 1.10.0 | Framework HTTP |
| GORM | 1.25.12 | ORM |
| PostgreSQL | 16 | Base de datos |
| JWT (golang-jwt/jwt) | 5.3.1 | Autenticación |
| google/uuid | 1.6.0 | PKs (UUID v4) |
| bcrypt | stdlib | Hash de contraseñas |
| godotenv | 1.5.1 | Variables de entorno |

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 16.2.4 | Framework (App Router) |
| React | 19.2.4 | UI |
| TypeScript | 5 | Tipado |
| Tailwind CSS | 4 | Estilos |
| Recharts | 3.8.1 | Gráficos |
| Lucide React | 1.11.0 | Íconos |

### Infraestructura
- PostgreSQL 16 vía Docker (`docker-compose.yml`), puerto **5462**
- Base de datos: `finanzas`
- Credenciales dev: `postgres / postgres`

---

## Estructura del monorepo

```
finanzas-app/
├── backend/
│   ├── cmd/main.go                    # Entry point, setup de rutas
│   └── internal/
│       ├── handler/                   # Capa HTTP (8 archivos)
│       ├── service/                   # Lógica de negocio (8 archivos)
│       ├── repository/                # Acceso a datos / GORM (7 archivos)
│       ├── model/                     # Structs de dominio (5 archivos)
│       ├── middleware/auth.go         # JWT middleware
│       └── db/db.go                   # Conexión y migraciones
├── frontend/
│   ├── app/                           # Páginas (App Router, 8 rutas)
│   ├── components/                    # Componentes React (6 subdirectorios)
│   └── lib/
│       ├── api.ts                     # Cliente HTTP centralizado
│       ├── auth.tsx                   # AuthContext + useAuth hook
│       └── types.ts                  # Tipos TypeScript
├── bruno/                             # Colección de pruebas de API
├── docs/                             # Documentación
└── docker-compose.yml
```

---

## Arquitectura backend

Patrón estricto: **Handler → Service → Repository**

- **Handler**: parsea request, llama al service, devuelve response HTTP
- **Service**: lógica de negocio, orquesta repositorios
- **Repository**: interfaz + implementación GORM; acceso a base de datos

---

## Modelos de dominio

### User
```
id (UUID PK) | email (unique) | password_hash | created_at | updated_at
```

### Category
```
id | user_id | name | color (hex 7 chars) | icon (lucide name)
type (income | expense | savings | investment)
type_changed_at | created_at | updated_at
```

### Transaction
```
id | user_id | category_id | type (income | expense)
amount | currency | description | date (YYYY-MM-DD)
status (confirmed | pending) | recurring_id (nullable)
created_at | updated_at
```

### RecurringTransaction
```
id | user_id | category_id | type | amount | currency
description | day_of_month (1-31) | active (bool)
created_at | updated_at
```

### FinancialGoal
```
id | user_id | name | target_amount | target_date (YYYY-MM-DD)
created_at | updated_at
```

---

## Endpoints de la API

**Base URL:** `http://localhost:8080`

### Autenticación (sin JWT)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login → devuelve JWT |

### Transacciones (requieren JWT)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/transactions` | Listar con filtros (month, year, type, category, status) |
| POST | `/api/transactions` | Crear transacción |
| PUT | `/api/transactions/:id` | Editar transacción |
| DELETE | `/api/transactions/:id` | Eliminar (204 No Content) |
| POST | `/api/transactions/import` | Importar CSV (multipart) |

### Transacciones recurrentes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/recurring` | Listar activas |
| POST | `/api/recurring` | Crear |
| DELETE | `/api/recurring/:id` | Desactivar (soft delete, 204) |

### Categorías
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/categories` | Listar todas |
| POST | `/api/categories` | Crear |
| PUT | `/api/categories/:id` | Editar |
| DELETE | `/api/categories/:id` | Eliminar (409 si tiene transacciones) |

### Estadísticas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/stats/monthly` | Últimos 6 meses (ingreso vs egreso) |
| GET | `/api/stats/categories` | Gastos del mes actual por categoría |

### Reportes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reports/summary` | Resumen (from, to) → income, expense, balance, savings_rate |
| GET | `/api/reports/by-category` | Desglose por categoría con % |
| GET | `/api/reports/monthly` | Desglose mensual de un año |
| GET | `/api/reports/top-transactions` | Top transacciones (income y expense separados) |
| GET | `/api/reports/export` | Exportar CSV (descargable) |

### Análisis
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/analysis/savings` | Ahorro mensual + proyecciones 6m y 12m (±20%) |
| GET | `/api/analysis/trends` | Tendencias de gasto por categoría vs período anterior |

### Metas financieras
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/goals` | Listar con status calculado |
| POST | `/api/goals` | Crear meta |
| PUT | `/api/goals/:id` | Editar meta |
| DELETE | `/api/goals/:id` | Eliminar meta |
| GET | `/api/goals/emergency-fund` | Recomendación de fondo de emergencia (3m y 6m) |

---

## Autenticación

- **Tipo:** JWT HS256, expiración 24 horas
- **Claims:** `user_id`, `email`, `exp`
- **Header requerido:** `Authorization: Bearer <token>`
- **Almacenamiento frontend:** `localStorage` (`"token"` y objeto `user`)
- **Auto-logout:** cualquier respuesta 401 limpia el estado y redirige a `/`

### Flujo de registro
1. `POST /api/auth/register` → hash bcrypt, crea usuario
2. El service hace seed de categorías por defecto para el usuario nuevo
3. El frontend llama automáticamente a `POST /api/auth/login` y guarda el token

---

## Funcionalidades implementadas

### Transacciones
- CRUD completo con filtros por mes, año, tipo, categoría y estado
- Estado: `confirmed` / `pending`
- Importación masiva desde CSV (multipart upload)
- Exportación a CSV con filtros opcionales
- Transacciones recurrentes: se definen con `day_of_month` (1-31); desactivación soft

### Categorías
- CRUD con nombre, color (hex), ícono (Lucide), y tipo
- Seed de categorías por defecto al registrarse
- Tracking de cuándo cambió el tipo (`type_changed_at`)
- No se puede eliminar una categoría que tenga transacciones asociadas (devuelve 409)

### Dashboard
- Selector de mes para navegar períodos
- Tarjetas: ingresos, egresos, balance del mes
- Gráfico de barras últimos 6 meses (Recharts)
- Gráfico de dona — top 3 categorías del mes
- Últimas 4 transacciones del mes seleccionado
- Botones de acción rápida

### Reportes
- Presets de rango: este mes, mes anterior, este año, personalizado
- Resumen: ingresos, egresos, balance, tasa de ahorro
- Desglose por categoría con porcentajes
- Vista mensual: tabla de 12 meses
- Top transacciones: listas separadas por ingreso y egreso
- Exportación CSV descargable

### Análisis
- **Ahorro:** detalle mensual + proyecciones a 6 y 12 meses con rango optimista/pesimista (±20%)
- **Tendencias:** comparación de gasto promedio por categoría vs período anterior (% y monto absoluto)

### Metas financieras
- CRUD de metas con nombre, monto objetivo y fecha objetivo
- Cálculo de ahorro mensual requerido
- Estado automático: `on_track`, `slightly_behind`, `off_track`
- Recomendación de fondo de emergencia: 3× y 6× gasto mensual promedio

---

## Frontend — Páginas

| Ruta | Página | Descripción |
|---|---|---|
| `/` | Login | Formulario de login |
| `/register` | Registro | Formulario de registro |
| `/dashboard` | Dashboard | Vista principal con resumen y gráficos |
| `/transactions` | Transacciones | Lista con filtros, importación |
| `/transactions/new` | Nueva transacción | Formulario create/edit (query param `?type=income\|expense`) |
| `/categories` | Categorías | CRUD de categorías |
| `/reports` | Reportes | Reportes con rangos de fechas |
| `/calendar` | Calendario | Vista de transacciones en calendario |
| `/profile` | Perfil | Info de usuario y logout |

---

## Frontend — Componentes

```
components/
├── layout/
│   ├── AppShell.tsx          # Layout principal: sidebar desktop + bottom nav mobile + auth guard
│   ├── Sidebar.tsx           # Navegación desktop
│   └── BottomNav.tsx         # Navegación mobile
├── transactions/
│   ├── TransactionList.tsx   # Lista de transacciones con filtros
│   ├── TransactionForm.tsx   # Formulario create/edit
│   └── ImportModal.tsx       # Modal de importación CSV
├── categories/
│   ├── CategoryList.tsx      # Lista + acciones CRUD
│   └── CategoryForm.tsx      # Formulario create/edit
├── charts/
│   ├── MonthlyBar.tsx        # BarChart 6m — Recharts
│   └── CategoryDonut.tsx     # PieChart categorías — Recharts
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    ├── Select.tsx
    ├── MultiSelect.tsx
    ├── Modal.tsx
    ├── Badge.tsx
    ├── MonthPicker.tsx
    └── ExportModal.tsx
```

---

## Variables de entorno

### Backend (`backend/.env`)
```
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5462/finanzas?sslmode=disable
JWT_SECRET=<string-aleatorio-seguro>
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Cómo levantar el proyecto

```bash
# 1. Base de datos
docker-compose up -d

# 2. Backend
cd backend
go run cmd/main.go

# 3. Frontend
cd frontend
npm install
npm run dev
```

Backend corre en `http://localhost:8080`, frontend en `http://localhost:3000`.

# Expense Tracker

Aplicación web para el control de gastos personales. Permite registrar ingresos y egresos, categorizarlos, y visualizar comparativas mensuales.

---

## Stack tecnológico

| Capa | Tecnología | Deploy |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Vercel |
| Backend | Go + Gin | Railway |
| Base de datos | PostgreSQL | Neon o Supabase (solo DB) |
| Storage de imágenes | Supabase Storage | — |
| ORM | GORM | — |
| Gráficos | Recharts | — |

---

## Estructura del repositorio

```
expense-tracker/
├── .claude/
│   ├── project-context.md
│   ├── backend-context.md
│   └── frontend-context.md
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── database.md
├── backend/              ← Go + Gin
├── frontend/             ← Next.js
└── README.md
```

---

## Estructura del backend (Go + Gin)

```
backend/
├── cmd/
│   └── main.go
├── internal/
│   ├── handler/
│   │   ├── transaction.go
│   │   ├── category.go
│   │   └── auth.go
│   ├── service/
│   │   ├── transaction.go
│   │   ├── category.go
│   │   └── auth.go
│   ├── repository/
│   │   ├── transaction.go
│   │   └── category.go
│   └── model/
│       ├── transaction.go
│       ├── category.go
│       └── user.go
├── db/
│   └── migrations/
├── go.mod
└── .env
```

Patrón de capas: `handler → service → repository`. El handler maneja HTTP, el service contiene la lógica de negocio, el repository habla con la base de datos.

---

## Estructura del frontend (Next.js)

```
frontend/
├── app/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── transactions/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   ├── categories/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx           ← login
├── components/
│   ├── transactions/
│   │   ├── TransactionForm.tsx
│   │   └── TransactionList.tsx
│   ├── charts/
│   │   ├── MonthlyBar.tsx
│   │   └── CategoryDonut.tsx
│   └── ui/
├── lib/
│   ├── api.ts             ← fetch al backend
│   └── types.ts
└── next.config.ts
```

---

## Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login, devuelve JWT |
| GET | `/api/transactions` | Listado con filtros (mes, tipo, categoría) |
| POST | `/api/transactions` | Crear transacción manual |
| PUT | `/api/transactions/:id` | Editar transacción |
| DELETE | `/api/transactions/:id` | Eliminar transacción |
| GET | `/api/categories` | Listar categorías del usuario |
| POST | `/api/categories` | Crear categoría |
| PUT | `/api/categories/:id` | Editar categoría |
| DELETE | `/api/categories/:id` | Eliminar categoría |
| GET | `/api/stats/monthly` | Datos para gráfico de barras mensual |
| GET | `/api/stats/categories` | Datos para gráfico de torta |

---

## Funcionalidades

### MVP

**Autenticación**
- Registro e inicio de sesión con email y contraseña
- Sesiones con JWT. Cada usuario ve solo sus propios datos
- Logout y redirección automática si no está autenticado

**Transacciones**
- Crear transacción manual: tipo (ingreso/egreso), monto, moneda, categoría, fecha, descripción opcional
- Editar y eliminar transacciones
- Listado filtrable por mes, tipo y categoría
- Soporte multi-moneda (ARS, USD, etc.). Los totales se muestran separados por moneda

**Categorías personalizables**
- Cada usuario tiene sus propias categorías con nombre y color
- Categorías precargadas por defecto al registrarse: alimentación, transporte, salud, vivienda, entretenimiento
- ABM completo. No se puede eliminar una categoría que tenga transacciones asociadas

**Dashboard**
- Resumen del mes: total ingresos, total egresos y balance (separado por moneda)
- Gráfico de barras: comparativa de gastos de los últimos 6 meses
- Gráfico de torta: distribución de egresos del mes por categoría

### V2 (segunda iteración)
- Exportar transacciones a CSV
- Conversión de monedas con tipo de cambio manual o automático
- Presupuesto mensual por categoría con barra de progreso

### V3 (futuro)
- Carga por foto de ticket con OCR via Claude API
- Categorización automática basada en historial del usuario

---

## Decisiones técnicas relevantes

- **GORM sobre SQLC para el MVP**: permite avanzar rápido mientras se aprende Go. Migrar a SQLC es posible una vez que el proyecto esté estable.
- **Multi-moneda sin conversión automática en el MVP**: cada transacción guarda su moneda. Los totales se muestran separados para evitar depender de un tipo de cambio.
- **Categorías por usuario con defaults**: al registrarse, el backend crea automáticamente un set de categorías base para evitar pantalla vacía.
- **Monorepo único**: frontend y backend en el mismo repositorio. Vercel y Railway apuntan cada uno a su subdirectorio.
- **Storage de imágenes en Supabase**: el frontend sube la imagen directamente a Supabase Storage y envía la URL al backend. Go nunca maneja el archivo binario.
- **CORS**: Gin necesita middleware CORS configurado para aceptar requests desde el dominio de Vercel.

---

## Variables de entorno

### backend/.env.example
```
PORT=8080
DATABASE_URL=postgresql://user:password@host:5432/expense_tracker
JWT_SECRET=your_secret_here
ANTHROPIC_API_KEY=your_key_here        # para V3
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### frontend/.env.example
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```
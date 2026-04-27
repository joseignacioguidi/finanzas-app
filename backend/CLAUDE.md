# Backend — Go + Gin

Soy nuevo en Go, vengo de NestJS. Preferir ejemplos explícitos
sobre código "mágico". Usar GORM como ORM.

## Stack
- Go + Gin (HTTP framework)
- GORM (ORM)
- PostgreSQL
- JWT para autenticación

## Estructura
- cmd/main.go → entry point
- internal/handler → HTTP handlers
- internal/service → lógica de negocio
- internal/repository → acceso a DB
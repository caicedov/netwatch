# NetWatch Backend - Getting Started

Este documento describe cómo iniciar el backend de NetWatch con PostgreSQL en Docker.

## Requisitos Previos

- Node.js 18+
- pnpm 8+
- Docker y Docker Compose

## Configuración Inicial

### 1. Instalar Dependencias

```bash
# Desde la raíz del monorepo
pnpm install
```

### 2. Iniciar PostgreSQL con Docker

```bash
# Desde la raíz del monorepo
docker-compose up -d
```

Esto iniciará PostgreSQL en el puerto `5432` con las siguientes credenciales:
- **Usuario**: `netwatch_user`
- **Password**: `netwatch_dev_password`
- **Database**: `netwatch_dev`

Verificar que PostgreSQL esté corriendo:

```bash
docker-compose ps
```

### 3. Ejecutar Migraciones

```bash
cd apps/backend
pnpm migration:run
```

Esto creará todas las tablas, índices, constraints y enums en la base de datos.

### 4. Verificar Migraciones

```bash
cd apps/backend
pnpm migration:show
```

Deberías ver la migración `InitialSchema1737648000000` marcada como ejecutada.

## Ejecutar el Backend

### Modo Desarrollo (con hot-reload)

```bash
cd apps/backend
pnpm dev
```

El servidor estará disponible en:
- **API**: http://localhost:3000/api

### Modo Producción

```bash
# Build
cd apps/backend
pnpm build

# Start
pnpm start
```

## Variables de Entorno

El archivo `.env` ya está configurado para desarrollo local. Si necesitas cambiar algo:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=netwatch_user
DB_PASSWORD=netwatch_dev_password
DB_NAME=netwatch_dev

# Security
JWT_SECRET=dev-secret-key-do-not-use-in-production
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Scripts Disponibles

### Backend

```bash
# Desarrollo con hot-reload
pnpm dev

# Build para producción
pnpm build

# Iniciar (requiere build previo)
pnpm start

# Type checking
pnpm type-check

# Linter
pnpm lint
pnpm lint:fix

# Tests
pnpm test
pnpm test:watch
pnpm test:e2e
```

### Migraciones

```bash
# Ejecutar migraciones pendientes
pnpm migration:run

# Revertir última migración
pnpm migration:revert

# Ver estado de migraciones
pnpm migration:show

# Crear nueva migración con timestamp automático (pide descripción por consola)
pnpm migration:new

# Crear nueva migración (manual, nombre completo indicado)
pnpm migration:create ./src/infrastructure/database/migrations/MigrationName
```

### Cómo crear y aplicar cambios de base de datos (paso a paso)

1) **Actualizar el modelo**: Ajusta las TypeORM entities en `src/infrastructure/database/entities/` (y, si aplica, el dominio y los mappers) para reflejar el nuevo schema.
2) **Generar archivo de migración vacío** (timestamp automático + descripción):
	```bash
	pnpm migration:new
	```
	El comando pedirá una descripción, generará el nombre con timestamp y creará el archivo con métodos `up` y `down` vacíos.
3) **Escribir SQL** en la migración: edita el archivo recién creado y agrega los `queryRunner.query(...)` necesarios tanto en `up` (aplicar) como en `down` (revertir). Sigue el estilo de `1737648000000-InitialSchema.ts` y evita modificar migraciones ya aplicadas.
4) **Ejecutar la migración** (contra tu base local Docker):
	```bash
	pnpm migration:run
	```
5) **Verificar estado**:
	```bash
	pnpm migration:show
	```
6) **Revertir si es necesario** (última migración):
	```bash
	pnpm migration:revert
	```

Notas importantes:
- Nunca edites una migración ya ejecutada; crea una nueva que avance o revierta el cambio.
- Mantén el nombre con timestamp para conservar el orden. El `InitialSchema` se generó así para dejar claro que fue la primera.
- En local, la base vive en Docker. Si necesitas empezar limpio: `docker-compose down -v` y vuelve a `docker-compose up -d`, luego `pnpm migration:run`.

## Gestión de Docker

```bash
# Iniciar PostgreSQL
docker-compose up -d

# Ver logs
docker-compose logs -f postgres

# Detener PostgreSQL
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Borra todos los datos)
docker-compose down -v

# Reiniciar PostgreSQL
docker-compose restart postgres
```

## Conectarse a PostgreSQL Directamente

```bash
# Usando Docker
docker exec -it netwatch-db psql -U netwatch_user -d netwatch_dev

# Usando psql local (si está instalado)
psql -h localhost -U netwatch_user -d netwatch_dev
```

Comandos útiles en psql:
```sql
-- Listar tablas
\dt

-- Describir tabla
\d users

-- Ver datos
SELECT * FROM users;

-- Salir
\q
```

## Estado Actual del Proyecto

### ✅ Implementado

- **Domain Layer**: Entidades puras con invariantes (User, Player, Computer, Defense, HackOperation, ProgressionUnlock)
- **Value Objects**: Money, Energy
- **TypeORM Entities**: Mapeadas al schema PostgreSQL
- **Mappers**: Conversión bidireccional domain ↔ persistence
- **Repositories**: 6 repositorios con queries específicas
- **Database Module**: Configuración TypeORM con pooling
- **Migrations**: Schema inicial completo
- **NestJS Modules**: users, players, computers, hacks, progression
- **AppModule**: Configurado con todos los módulos
- **main.ts**: Bootstrap de NestJS con CORS

### ❌ Pendiente

- **Services/Use-Cases**: Lógica de aplicación
- **HTTP Controllers**: Endpoints REST
- **WebSocket Gateway**: Comunicación real-time
- **Authentication**: JWT guards, password hashing
- **Validation**: DTOs con class-validator
- **Error Handling**: Exception filters
- **Logging**: Winston o Pino
- **Tests**: Unit, integration, E2E

## Próximos Pasos

1. Implementar servicios de aplicación (use-cases)
2. Crear controllers HTTP siguiendo `docs/backend-engineer/api-contracts.md`
3. Implementar WebSocket gateway siguiendo `docs/backend-engineer/realtime-events.md`
4. Agregar autenticación JWT
5. Agregar validación de DTOs
6. Implementar tests siguiendo `docs/backend-engineer/testing-strategy.md`

## Troubleshooting

### Error: "Cannot connect to database"

1. Verificar que Docker esté corriendo: `docker ps`
2. Verificar logs: `docker-compose logs postgres`
3. Verificar credenciales en `.env`
4. Reiniciar contenedor: `docker-compose restart postgres`

### Error: "Migration failed"

1. Verificar que PostgreSQL esté corriendo
2. Verificar que la base de datos existe: `docker exec -it netwatch-db psql -U netwatch_user -l`
3. Revisar logs de migración
4. Si es necesario, revertir: `pnpm migration:revert`

### Error: "Port 5432 already in use"

1. Detener PostgreSQL local si está corriendo
2. O cambiar el puerto en `docker-compose.yml` y `.env`

### Error: "Module not found"

1. Limpiar y reinstalar: `pnpm install --no-frozen-lockfile`
2. Rebuild domain: `pnpm --filter @netwatch/domain build`
3. Rebuild backend: `pnpm --filter backend build`

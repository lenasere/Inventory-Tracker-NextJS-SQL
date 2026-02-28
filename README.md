# Restaurant Inventory Tracker

This repository contains a restaurant inventory system built as a pnpm workspace with two main parts:

1. A Next.js dashboard application (`app/`) for inventory visualization and CRUD operations.
2. A standalone Node.js REST API package (`backend/api`) that uses raw SQL and PostgreSQL (no ORM).

The API is responsible for database access, migrations, seeding, and CRUD endpoints for five inventory storage units:

1. Foods
2. Drinks
3. Cleaning/Chemicals
4. Clothes
5. Utilities

## 1. Architecture

## 1.1 Monorepo structure

- `app/`: Next.js App Router frontend
- `backend/api/`: Express + PostgreSQL backend
- `backend/api/sql/migrations/`: SQL migration files
- `backend/api/sql/seeds/`: SQL seed files
- `backend/api/sql/queries/<table>/`: table-scoped SQL CRUD queries
- `backend/.env`: shared environment configuration for API and DB scripts

## 1.2 Technology choices

- Frontend: Next.js 16, React 19, Tailwind CSS 4
- Backend: Node.js + Express
- Database: PostgreSQL
- Querying: raw SQL files loaded at runtime
- Package manager/workspace: pnpm

## 1.3 Data model strategy

Each storage unit is intentionally modeled as its own table:

- `foods`
- `drinks`
- `cleaning_chemicals`
- `clothes`
- `utilities`

Each table uses the same schema shape, making the API and SQL query layout consistent.

## 2. Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+
- `psql` CLI available in `PATH`

You must have a running PostgreSQL server before running migrations/seeds.

## 3. Environment Configuration

## 3.1 Shared env file

Create `backend/.env` (or copy from `backend/env.sample`):

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/restaurant_inventory
API_PORT=4000
CORS_ORIGIN=http://localhost:3000
```

## 3.2 Frontend API base URL

Create `.env.local` at repository root:

```env
NEXT_PUBLIC_INVENTORY_API_URL=http://localhost:4000
```

Notes:

- Frontend reads `NEXT_PUBLIC_INVENTORY_API_URL`.
- API config loads env files from:
  1. `backend/.env`
  2. `backend/api/.env` (optional override)
  3. current working directory `.env`

## 4. Installation

From repository root:

```bash
pnpm install
```

This installs dependencies for all workspace packages.

## 5. Database Setup

## 5.1 Create database

Create database manually once (example):

```bash
createdb restaurant_inventory
```

If using a custom user/password/database, update `DATABASE_URL` accordingly.

## 5.2 Run migrations and seed

From root:

```bash
pnpm db:setup
```

Equivalent explicit steps:

```bash
pnpm db:migrate
pnpm db:seed
```

What these scripts do:

- `db:migrate`: executes `backend/api/sql/migrate.sql`
- `db:seed`: executes `backend/api/sql/seed.sql`

The scripts load env values from `backend/.env` and fail fast if `DATABASE_URL` is missing.

## 5.3 Migration order

`backend/api/sql/migrate.sql` runs these files in order:

1. `000_create_audit_trigger.sql`
2. `001_create_foods.sql`
3. `002_create_drinks.sql`
4. `003_create_cleaning_chemicals.sql`
5. `004_create_clothes.sql`
6. `005_create_utilities.sql`

## 5.4 Seed order

`backend/api/sql/seed.sql` runs these files:

1. `seeds/foods.sql`
2. `seeds/drinks.sql`
3. `seeds/cleaning_chemicals.sql`
4. `seeds/clothes.sql`
5. `seeds/utilities.sql`

Each seed file uses `ON CONFLICT (item_name) DO UPDATE` for repeatable seeding.

## 6. Running the Project

## 6.1 Run frontend and API together

```bash
pnpm dev:all
```

## 6.2 Run separately

Terminal 1:

```bash
pnpm dev:api
```

Terminal 2:

```bash
pnpm dev
```

Default endpoints:

- Frontend: `http://localhost:3000`
- API: `http://localhost:4000`

## 7. Root Scripts

From root `package.json`:

- `pnpm dev`: run Next.js app
- `pnpm dev:api`: run API package
- `pnpm dev:all`: run app + API in parallel
- `pnpm db:migrate`: run SQL migrations
- `pnpm db:seed`: run SQL seed scripts
- `pnpm db:setup`: migrate + seed
- `pnpm lint`: run lint checks
- `pnpm build`: build Next.js app
- `pnpm start`: start built Next.js app

## 8. API Package Scripts

From `backend/api/package.json`:

- `pnpm --filter @restaurant/api dev`
- `pnpm --filter @restaurant/api build`
- `pnpm --filter @restaurant/api start`
- `pnpm --filter @restaurant/api db:migrate`
- `pnpm --filter @restaurant/api db:seed`

## 9. Database Schema

Each table has these columns:

- `id BIGSERIAL PRIMARY KEY`
- `item_name TEXT NOT NULL UNIQUE`
- `unit TEXT NOT NULL`
- `quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0)`
- `reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0)`
- `unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0)`
- `notes TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

`updated_at` is managed by a trigger function `set_updated_at()` on UPDATE.

## 10. SQL Query Organization

CRUD SQL files are separated per table:

`backend/api/sql/queries/<table>/`

- `get_all.sql`
- `get_by_id.sql`
- `insert.sql`
- `update.sql`
- `delete.sql`

Current `<table>` directories:

- `foods`
- `drinks`
- `cleaning_chemicals`
- `clothes`
- `utilities`

This structure keeps SQL explicit, testable, and easy to audit.

## 11. REST API Contract

Base URL: `http://localhost:4000/api`

Health endpoint:

- `GET /health`

Storage unit endpoints (same pattern for each unit):

- `GET /foods`
- `GET /foods/:id`
- `POST /foods`
- `PUT /foods/:id`
- `DELETE /foods/:id`

Equivalent endpoints also exist for:

- `/drinks`
- `/cleaning-chemicals`
- `/clothes`
- `/utilities`

## 11.1 Request body for POST/PUT

```json
{
  "item_name": "Tomatoes",
  "unit": "kg",
  "quantity_in_stock": 35,
  "reorder_level": 20,
  "unit_cost": 2.1,
  "notes": "Fresh produce"
}
```

Validation rules enforced by API:

- `item_name`: required non-empty string
- `unit`: required non-empty string
- `quantity_in_stock`: number >= 0
- `reorder_level`: number >= 0
- `unit_cost`: number >= 0
- `notes`: optional string (empty string converted to `null`)

## 11.2 Response shape

List endpoint:

```json
{
  "data": [
    {
      "id": 1,
      "item_name": "Tomatoes",
      "unit": "kg",
      "quantity_in_stock": 35,
      "reorder_level": 20,
      "unit_cost": 2.1,
      "notes": "Fresh produce",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

Single-item endpoint:

```json
{
  "data": {
    "id": 1,
    "item_name": "Tomatoes",
    "unit": "kg",
    "quantity_in_stock": 35,
    "reorder_level": 20,
    "unit_cost": 2.1,
    "notes": "Fresh produce",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Delete endpoint returns `204 No Content`.

## 11.3 Error behavior

- `400`: invalid request payload or invalid `id`
- `404`: item not found
- `500`: server/database error

## 12. Frontend Dashboard Features

Implemented dashboard capabilities:

- Aggregate stats across all five tables
  - total item count
  - low-stock item count
  - total inventory value (DKK)
- Graphs
  - quantity by storage unit
  - selected unit stock bars
- Inventory operations
  - add item
  - update item
  - delete item
- Unit switching
  - foods, drinks, cleaning/chemicals, clothes, utilities

Frontend file:

- `app/page.tsx`

## 13. Currency

Dashboard currency formatting uses Danish kroner:

- Locale: `da-DK`
- Currency: `DKK`

## 14. Troubleshooting

## 14.1 `pnpm db:setup` appears to do nothing

Cause: `psql` can enter interactive mode if command options are passed in wrong order.

Current scripts are configured to avoid this by using:

```bash
psql -v ON_ERROR_STOP=1 -d "$DATABASE_URL" -f <file>
```

## 14.2 PostgreSQL connection errors

If you see connection failures:

- verify PostgreSQL is running
- verify `DATABASE_URL` in `backend/.env`
- verify database exists (`restaurant_inventory` by default)
- test manually:

```bash
psql -d "$DATABASE_URL" -c "select now();"
```

## 14.3 Frontend cannot reach API

If dashboard shows API error:

- ensure `pnpm dev:api` is running
- ensure `.env.local` has `NEXT_PUBLIC_INVENTORY_API_URL=http://localhost:4000`
- ensure CORS origin includes frontend URL (`http://localhost:3000`)

## 14.4 Duplicate item name insert errors

Each table enforces unique `item_name`. Use update endpoint for existing records.

## 15. Extending the System

Recommended extension path:

1. Add `PATCH` route for partial updates.
2. Add pagination/filter/sort params to list endpoints.
3. Add movement/history table for stock transactions.
4. Add tests for API route validation and SQL integration.
5. Add authentication and role-based access control.

## 16. Development Conventions

- Keep SQL in dedicated files under `backend/api/sql/queries`.
- Keep migrations append-only and ordered numerically.
- Prefer explicit SQL over hidden abstraction for maintainability.
- Keep request/response contracts stable and documented.


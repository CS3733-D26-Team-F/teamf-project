# Backend Overview

This package contains the Express API for the project, including:

- HTTP routes for employees and content forms
- authentication-related endpoints
- Prisma database access
- Supabase/Auth0 integration helpers
- file upload and other backend setup utilities

## Running the backend

### Prerequisites

- Node.js
- npm
- A Postgres connection string
- PowerShell on Windows, or another terminal that can run npm scripts

### 1) Install dependencies

From the repository root:
`npm install`

### 2) Configure environment variables

Create `apps/backend/.env` and add:
- DATABASE_URL="<your-postgres-connection-string>"
- DIRECT_URL="<your-postgres-connection-string>"
- Also add the appropriate AUTH0, Supabase, and Mistral constants

Notes:

- `DIRECT_URL` is preferred when present.
- If `DIRECT_URL` is missing, the backend falls back to `DATABASE_URL`.
- Keep both values pointed to the same database.

### 3) Start the backend

From the repository root: `npm run dev`

Or run the backend directly: \apps\backend npm run dev

The backend should be available at:

- `http://localhost:3000`

## Useful backend scripts

- `dev` — starts the backend in watch mode
- `start` — starts the backend normally
- `build` — refreshes Prisma schema/client artifacts

## How the backend is organized

### Main entry point

- `app.ts` — application startup and server wiring

### Routes

API routes are organized in:

- `routes/` — route handlers for features like login, employees, content forms, and chat

### Setup and shared helpers

Backend support code is stored in:

- `setup/` — external service and infrastructure setup
- `src/` — shared backend source files, if used by the app
- `requireRole.ts` — role-based access helper (unused)
- `migration.ts` — database-related migration for raw migrations
- `prisma/` — Prisma schema and database files


## API endpoints

Common routes exposed by the backend include:

- `/`
- `/employees`
- `/contentforms`

Authentication and user-related routes are also available, along with content form routes for reading, updating, uploading, checking out, and deleting records.
Most API functions take in a checkJWT from Auth0 in order to help verify that the user who is logged in can use them.

## Where API logic lives

A quick map of common backend responsibilities:

- `routes/login.ts` — login/auth-related endpoints
- `routes/employees.ts` — employee endpoints
- `routes/contentforms.ts` — content form endpoints
- `routes/chat.ts` — chat-related endpoints
- `setup/prisma.ts` — Prisma client/database wiring
- `setup/auth0.ts` — Auth0-related configuration
- `setup/supabase.ts` — Supabase integration
- `setup/upload.ts` — upload handling
- `setup/checkout.ts` — checkout/check-in related helpers

## Prisma troubleshooting

### Prisma client looks out of sync

Try regenerating Prisma artifacts: `\apps\backend npx prisma generate`

If the schema should be refreshed from the database, run: `\apps\backend npx prisma db pull`

### Database connection issues

If Prisma cannot connect:

1. Check `apps/backend/.env`
2. Confirm `DATABASE_URL` and `DIRECT_URL` are correct
3. Make sure the database is reachable from your network
4. Try: `npm run db:pull`

### Common Prisma symptoms

- `P1001` usually means the database host cannot be reached
- Routes may return `500` if the database is unavailable
- A schema mismatch often means you need `db:pull` or `db:generate`

### Notes on backend behavior

- The root route should still respond even if the database is unavailable
- Data-heavy routes depend on Prisma connectivity
- File and content routes may require proper auth/session setup depending on the endpoint

## Stopping the backend

Use: `Ctrl+C`

in the terminal running the server.

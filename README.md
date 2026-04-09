# CS3733 - Hanover Insurance Content Management System

## Running the Project



### What's needed

- Node.js
- A Postgres connection string
- PowerShell

### 1) Install dependencies

From the repo root:

```powershell
npm install
```

### 2) Set up backend env

Create `apps/backend/.env` with:

```dotenv
DATABASE_URL="<your-postgres-connection-string>"
DIRECT_URL="<your-postgres-connection-string>"
```

Important:

- Backend uses `DIRECT_URL` first.
- If `DIRECT_URL` is missing, it falls back to `DATABASE_URL`.
- Keep both pointed to the same DB to avoid confusing behavior.

### 3) Start everything

From the repo root:

```powershell
npm run dev
```

Expected URLs:

- Frontend: http://localhost:5173 (or next available port)
- Backend: http://localhost:3000

### 4) Optional: run apps separately

If separate terminals/process control:

Backend terminal:

```powershell
Set-Location .\apps\backend
npm run dev
```

Frontend terminal:

```powershell
Set-Location .\apps\frontend
npm run dev
```

### 5) Stop servers

Use `Ctrl + C` in each terminal.

## API Endpoints

- http://localhost:3000/
- http://localhost:3000/employees
- http://localhost:3000/contentforms
- http://localhost:3000/employee_manage
- http://localhost:3000/login

Notes:

- `/` should return 200 even if DB is down.
- Data routes depend on DB connectivity and may return 500 if Prisma cannot connect.

## Prisma Commands

Run these from repo root:

```powershell
npm run db:generate
npm run db:pull
npm run db:push
npm run db:migrate:dev
npm run db:migrate:reset
npm run db:studio
```

These root scripts read `apps/backend/.env` and pass DB env vars to the `db` workspace automatically.

## Troubleshooting

Backend starts but data routes fail:

1. Confirm `DIRECT_URL` / `DATABASE_URL` are correct in `apps/backend/.env`.
2. Run `npm run db:pull` to test DB connectivity.
3. If you see Prisma `P1001`, the DB host is not reachable from your current network.

Frontend is up but no data appears:

1. Make sure backend is running on port 3000.
2. Test backend endpoint directly in browser (for example `/employees`).

## Project Structure Notes

1. one clear backend entrypoint (`app.ts` vs `src/server.ts`).
2. Keep dependencies in the package that actually uses them.
3. Keep package manager metadata and lockfile aligned (currently npm + package-lock).
4. Document folder ownership clearly:
   - `apps/frontend` = React UI
   - `apps/backend` = Express API
   - `packages/db` = Prisma/shared DB client
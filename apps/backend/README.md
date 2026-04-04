# Backend Run Commands

## Use these commands every time

From repo root (PowerShell):

```powershell
Set-Location .\apps\backend
$env:DATABASE_URL="<your-postgres-connection-string>"
npm run dev
```

Backend starts at:
- http://localhost:3000

API endpoints:
- http://localhost:3000/employees
- http://localhost:3000/employee_manage
- http://localhost:3000/contentforms

## First-time setup only

From repo root:

```powershell
npm install
```

If Prisma client looks out of sync:

```powershell
Set-Location .\apps\backend
npx prisma generate
```

## Optional: avoid setting DATABASE_URL each time

Create `apps/backend/.env` and add:

```dotenv
DATABASE_URL="<your-postgres-connection-string>"
```

Then each run is just:

```powershell
Set-Location .\apps\backend
npm run dev
```

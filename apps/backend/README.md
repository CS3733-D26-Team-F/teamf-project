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

Testing login function: 
- make sure server is running ^
- open up postman 
- Set method from "GET" to "POST"
- url is: http://localhost:3000/login
- make sure under URL: 
  - set to body,
  - param is raw
  - Text is JSON
    - run command in space below: 
      - {
        "username": "testingtesting",
        "password": "wpiiscool"
        }
- Test username or password for different error prints!

## Database Correlations
Employee:
- username (unique, VARCHAR(50))
- password (VARCHAR(20))
- persona (VARCAR(20), CHECK ('Admin', 'Underwriter', 'Business Analyst'))
- admin (admin?)

Admin
- adid (foreign key only, nothing else unique right now)

Functions
- "/addEmployee" adds a new employee
- "/login" does the login check based on username and password
- "/deleteEmployee/:username" deletes an employee based on the username (replace :username with the name in question)
- "/employee" displays the list of employees
- "/contentforms" lists the content form data


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

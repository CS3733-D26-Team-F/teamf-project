# Backend Run Commands

## Use these commands every time

From repo root (PowerShell):

```powershell
Set-Location .\apps\backend
$env:DATABASE_URL="<your-postgres-connection-string>"
npm run dev
```
For API Calls:
- Use api("{$DOMAIN}/call) **not** fetch for authentification purposes

Backend starts at:
- http://localhost:3000

Main API endpoints:
- http://localhost:3000/api/auth/login
- http://localhost:3000/employees
- http://localhost:3000/contentforms

## Database Correlations
Main Employee:
- username (unique, VARCHAR(50))
- password (VARCHAR(20))
- persona (VARCAR(20), CHECK ('Admin', 'Underwriter', 'Business Analyst'))
- admin (admin?)

Admin
- adid (foreign key only, nothing else unique right now)

Basic Functions
- "/api/auth/login" is the login call
- "/api/auth/me" pulls up the logged in profile
- "api/auth/logout" is a placeholder for any logout functionality
- "/employees" gets all the employee data
- "/contentforms" gets all the non-soft deleted content forms
- "/getEmployee" posts a single employee
- "/updateEmployee" patch updates an employee's data in both the supabase and auth0
- "/addEmployee" adds a new employee
- "/deleteEmployee/:username" deletes an employee based on the username (replace :username with the name in question)
- "/employees/:empid/profile-picture" updates an employee's picture
- "/updateTheme" updates the theme toggle
- "/updateContentForm" updates a content form
- "/addFileToBucket" adds a file to the appropriate bucket for content
- "/contentforms" post updates files in the buckets
- "/deleteContentForm/:id" deletes a content from (hard)
- "/contentforms/persona/:persona" gets the persona(s) of a content form
- "/contentforms/admin" gets all the contentforms for admin
- "/contentforms/persona/:persona/:field" gets a field of a forms based on a persona
- "/contentforms/filter/:persona/:file_type" gets the file type
- "/contentforms/trash" gets the trash (soft deleted files)
- "/contentforms/:id/softdelete" is the soft delete
- "/contentforms/:id/restore" removes the soft delete of a form
- "/contentforms/:id/permanent" ensures full hard deletion
- "/contentforms/autoexpire" auto-expires any forms that are set to expire
- "/contentforms/archived" gets all forms that are archived
- "/contentforms/expired" gets all the expired content forms
- "/contentforms/:id/status" gets all the forms of a status
- "/contentforms/:id" retrieves forms by id
- "/contentforms/:id/checkout" checks out forms based on id
- "/contentforms/:id/checkin" checks in forms
- "/contentforms/:id/checkout_status" displays whether a form is checked out
- "/contentforms/checkout/all" displays all checked out forms
- "/contentforms/:id" PUT puts a new file into the content form at that id
- "/contentforms/employee/:empid" gets all of an employee's content forms
- "/contentforms/:id/favorite" makes a content form a favorite
- "/ba-files" is a soon to be implemented view of the ba file size
- "/uw-files" is a soon to be implemented view of the uw file size
- "/uw-files/:name" soon to be implemented gets a specific form's file size uw
- "/ba-files/:name" soon to be implemented gets a specific form's file size ba

## First-time setup only

From repo root:

```powershell
npm install
```

If Prisma client looks out of sync:

```powershell
Set-Location .\apps\backend
npx prisma db pull
npx prisma generate
```

## Optional: avoid setting DATABASE_URL each time

Create `apps/backend/.env` and add:

```dotenv
DATABASE_URL="<your-postgres-connection-string>"
DIRECT_URL="<your-postgres-url-string>"
AUTH0 CALLS
```

Then each run is just:

```powershell
Set-Location .\apps\backend
npm run dev
```

# CS 3733 Team Forest Fairies
## Special Features:
- Auth0 Login Authentication
- Archive Page
- List and Grid Views for Documents
- Toggle Between Inline and Popup views for Documents
- Red-Green Color-Blindness Filter
- Soft Delete for Documents
- Footer with Social Links
- Recently Viewd Display
- Bulk Upload Documents and Links
  - Autofill optional on bulk upload 
- Customizable Widget-Based Dashboard
  - Widgets are personalized for and vary based on user
  - Admin have special widgets for tracking all employees
- Sound and Video File Options
- The AI Chatbot
  - Can for add, delete, find, favorite, checkin in and out, restore, and view documents
  - Can send notifications to other users
  - Can find documents based on keywords
  - Can take in voice prompts
  - Can display a portal summary of the website
  - Can display a navigation menu for the website
- Full Translated Website in 9 Additional Languages
- Folder Sorting System
  - Can create folders and subfolders to sort documents
  - Can privatize folders to only allow certain users to view them
  - Can add, move, and delete documents in folders
  - Can update folder access
  - Can duplicate folders
- Possible Workflow System (WIP)

# The Hanover Insurance CMS

This repository contains the full application stack for the project:
- `apps/frontend` — React frontend
- `apps/backend` — Express API

## What you need

- Node.js
- npm
- A Postgres connection string for the backend
- PowerShell on Windows, or another terminal that can run npm scripts

## Project setup

### 1) Install dependencies

From the repository root: `npm install`

### 2) Configure backend environment variables

Create `apps/backend/.env` and add the required database connection values:
- DATABASE_URL="<your-postgres-connection-string>"
- DIRECT_URL="<your-postgres-connection-string>"
- AUTH0, Supabase, and Mistral keys 

Create `apps/frontend/.env` and add the required database connection values:
- AUTH0 keys

Notes:
- `DIRECT_URL` is preferred when present.
- If `DIRECT_URL` is missing, the backend falls back to `DATABASE_URL`.
- Keep both database values pointed at the same database to avoid confusing behavior.

## Running the project

### Start everything from the repository root
`npm run dev`

This usually starts:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

If a port is already in use, one of the apps may move to the next available port, though 5173 is preferred overall.

### Run apps separately

If you want separate terminals or need to restart one app without affecting the other:

#### Backend
`.\apps\backend npm run dev`
#### Frontend
`.\apps\frontend npm run dev`

## App organization

### `apps/frontend`

The frontend is the user-facing React app. It includes:

- page-level screens
- shared UI components
- login and access control flows
- document/content views
- employee management views
- shared hooks, constants, and styles
- static assets in `public/`

Good places to look:

- `src/main.tsx` — app entry point
- `src/App.tsx` — top-level app wiring
- `src/pages/` — page-level screens
- `src/components/` — reusable UI pieces
- `src/hooks/` — custom hooks
- `public/` — static assets

### `apps/backend`

The backend is the Express API. It includes:

- HTTP routes for employees and content forms
- authentication-related endpoints
- Prisma database access
- integration helpers and backend setup code
- upload and checkout/check-in related utilities

Common areas:

- main application startup and server wiring
- route handlers for major features
- Prisma and database configuration
- service/integration setup

### API and Frontend Request Behavior Notice

The frontend uses the shared API helper for requests rather than calling `fetch` directly. That keeps request behavior consistent and reduces duplicated setup for authentication.
Please use `api` as the call for backend API calls instead.

# Troubleshooting

## Frontend issues

### The frontend does not start

Check:
- dependencies are installed
- Node.js is working correctly
- the Vite dev port is not already in use
- package.json has the correct versions for all dependencies
  - Note: `npm install` may not install the latest versions, if you suspect the package.json has changed run
    - `rmdir package-lock.json`
    - `npm install`

Try: `npm install cd apps/frontend`
`npm run dev`

### The page loads, but no data appears

Usually this means the frontend cannot reach the backend.

Check:

- the backend is running
- the backend URL is correct
- browser dev tools for failed network requests
- the shared API helper is pointed at the correct domain

### Styles, images, or icons are broken

Check:

- files exist in `apps/frontend/public/`
- imports point to the correct paths
- there are no console errors about missing assets

### Build or type errors in the frontend

Look for:

- broken imports
- invalid component props
- TypeScript errors in the terminal
- stale generated or cached files

## Backend issues

### Backend starts, but data routes fail

Check:

- `apps/backend/.env` exists
- `DATABASE_URL` and `DIRECT_URL` are correct
- if the correct keys are in your dotenv file
- the database is reachable from your network

If needed, run Prisma commands from the repo root to verify the schema and connection.

### Prisma looks out of sync

Symptoms may include schema mismatches or unexpected runtime failures.

Try:

- regenerating Prisma artifacts
- refreshing the schema from the database

### A route returns 500

This often means the backend cannot reach the database or an integration dependency is misconfigured.

Check backend terminal logs first, then confirm the environment variables.

## Recommended workflow

1. Install dependencies once from the repo root.
2. Configure backend environment variables.
3. Start the backend.
4. Start the frontend.
5. Use browser dev tools and terminal output together when debugging.

## Useful checks while troubleshooting

- verify the frontend and backend are on the expected ports
- confirm the backend is reachable from the browser
- inspect terminal logs for TypeScript, Vite, Prisma, or network errors
- confirm static assets exist before importing them
- keep frontend requests going through the shared API helper

## Contributing notes

- keep page-level logic in `apps/frontend/src/pages/`
- keep reusable UI in `apps/frontend/src/components/`
- keep backend route logic in the backend route files
- keep database/schema changes in the Prisma area
- update the relevant README when a folder layout or startup step changes

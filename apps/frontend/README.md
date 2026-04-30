# Frontend Overview

This folder contains the React frontend for the app.

## What this app does

The frontend is the user-facing UI. It handles:

- navigation between pages
- login and access control screens
- content/document views
- employee management screens
- shared UI components like headers, footers, modals, and toggles

## How to run the frontend

### Prerequisites

Make sure you have:

- Node.js installed
- dependencies installed from the repository root with `npm install`

### Start the frontend only

From the repository root: `.\apps\frontend npm run dev`

The app will run on the Vite dev server, usually at:

- `http://localhost:5173`

If that port is already in use, Vite may choose the next available port, though this port is heavily preferred.

## Environment setup

If the frontend depends on API calls, make sure the backend is also running and reachable.

Keep environment variables in the frontend `.env` file in this folder.

## API usage

Use the shared API helper for requests instead of calling `fetch` directly.

This keeps request handling consistent across the app and avoids duplicated setup.

## Common troubleshooting

### 1) The frontend does not start

Check for:

- missing dependencies
- a bad Node.js install
- another process already using the Vite port

If the port is busy, stop the process using it or let Vite pick another port.

### 2) The page loads, but data does not appear

Usually this means the frontend cannot reach the backend.

Check:

- the backend is running
- the backend URL is correct
- the API helper is pointing at the expected domain
- browser dev tools for failed network requests

### 3) Login or protected pages fail

Check:

- the backend auth flow is running
- your session/token state is valid
- the user is allowed to access the page

### 4) Styles or assets look broken

Check:

- files exist in `public/`
- component imports point to the right paths
- there are no console errors from missing assets

### 5) Build or type errors

If the app starts but fails during build or type checking, look for:

- broken imports
- mismatched component props
- stale generated files
- TypeScript errors in the terminal

## Frontend organization

### `src/main.tsx`

App entry point. This is where React mounts into the DOM.

### `src/App.tsx`

Top-level app component and main layout/router wiring.

### `src/pages/`

Page-level screens. These are the larger views users navigate to.

Examples include:

- about
- main menu
- profile page
- document/archive views
- notifications
- statistics

### `src/components/`

Reusable UI pieces shared across pages.

Examples include:

- header and footer
- chatbot
- theme toggle
- settings modal
- access denied screen
- reusable content and login-related components
- card modals

### `src/components/interfaces/`

Shared TypeScript interfaces used across components.

### `src/hooks/`

Custom React hooks for shared behavior.

### `src/const.ts`

Shared constants used throughout the frontend.

### `public/`

Static assets served directly by Vite, such as:

- icons
- images
- carousel assets

### `src/App.css` and `src/FooterLinks.module.css`

Shared styling files for app-level and component-level styles.

## Recommended workflow

1. Start the backend first if the frontend needs live data.
2. Start the frontend with `npm run dev`.
3. Check the browser console and terminal output if something looks off.
4. Use the shared API helper for requests so behavior stays consistent.

## Useful checks when debugging

- verify the frontend is running on the expected port
- verify the backend URL is correct
- confirm the browser can reach the API endpoints
- inspect terminal logs for TypeScript, Vite, or network errors
- confirm assets exist in `public/` before importing them

## Notes for contributors

- keep page-level logic in `src/pages/`
- keep reusable UI in `src/components/`
- prefer shared helpers over duplicated request logic
- keep static assets in `public/`
- update this README if new folders or major frontend flows are added

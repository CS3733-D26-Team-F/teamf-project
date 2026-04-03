# Backend Read me docs #

Setting up:
- Install dependencies: `npm install`
- Set environment variables (e.g., `DIRECT_URL`, `DATABASE_URL`)
  (these can be found pinned in a discord database channel)

Commands for seeding:
- in the Supabase, go to SQL Editor and INSERT INTO table VALUES
- after  querying, run `npm prisma db pull` to pull from database
- run `npx prisma generate` to fully sync the changes

Commands for database:
- run `npm prisma push` to force push the schema to the database (avoid)
- run `npm prisma migrate dev` to run migrations (like git for database)

Common problems: 
- errors with prisma run `npx prisma generate`

Running server.js (pnpm version):
- have .env files in apps\backend and packages\db
- cd apps/backend
- pnpm --filter db exec prisma db pull
- pnpm --filter db exec prisma generate
- npx tsc
- node dist/server.js

Fix morgan and run server.js:
- npm install
- npm install dotenv
- cd db
- npm install
- npx prisma db pull
- npx prisma generate
- cd backend
- npm install @types/morgan
- npx tsc
- node dist/server.js

Run express:
- run app.ts
- localhost:3000/employees for the employee list
- localhost:3000/employee_manage for the employee management
- localhost:3000/contentforms for the content management forms

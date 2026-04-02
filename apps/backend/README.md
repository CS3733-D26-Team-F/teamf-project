# Backend Read me docs #

Setting up:
- Install dependencies: `pnpm install`
- Set environment variables (e.g., `DIRECT_URL`, `DATABASE_URL`)
  (these can be found pinned in a discord database channel)

Commands for seeding:
- in the Supabase, go to SQL Editor and type in SQL commands
- after  querying, run `pnpm prisma db pull` to pull from database
- run `pnpm prisma generate` to fully sync the changes

Commands for data base:
- run `pnpm prisma push` to force push the schema to the database
- run `pnpm prisma migrate dev` to run migrations (like git for database)

Common problems: 
- errors with prisma run `pnpm prisma generate`

Running server.js:

- have .env files in apps\backend and packages\db
- cd apps/backend
- pnpm --filter db exec prisma db pull
- pnpm --filter db exec prisma generate
- npx tsc
- node dist/server.js

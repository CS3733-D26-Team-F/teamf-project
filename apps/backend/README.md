# Backend Read me docs #

Setting up:
- Install dependencies: `pnpm install`
- Set environment variables (e.g., `DIRECT_URL`, `DATABASE_URL`)
  (these can be found pinned in a discord database channel)


Commands for data base:
- run `pnpm prisma push` to force push the schema to the database
- run `pnpm prisma migrate dev` to run migrations (like git for database)

Common problems: 
- errors with prisma run `pnpm prisma generate`
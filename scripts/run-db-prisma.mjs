import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const prismaScript = process.argv[2];

if (!prismaScript) {
  console.error(
    "Usage: node scripts/run-db-prisma.mjs <db:generate|db:pull|db:push|db:migrate:dev|db:migrate:reset|db:studio>"
  );
  process.exit(1);
}

function loadEnvValue(filePath, key) {
  if (!existsSync(filePath)) return undefined;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (!trimmed.startsWith(`${key}=`)) continue;

    const raw = trimmed.slice(key.length + 1).trim();
    return raw.replace(/^['\"]|['\"]$/g, "");
  }

  return undefined;
}

const backendEnvPath = resolve(process.cwd(), "apps/backend/.env");
const directUrl = process.env.DIRECT_URL ?? loadEnvValue(backendEnvPath, "DIRECT_URL");
const databaseUrl = process.env.DATABASE_URL ?? loadEnvValue(backendEnvPath, "DATABASE_URL");
const resolvedUrl = directUrl ?? databaseUrl;

if (!resolvedUrl) {
  console.error("Missing DIRECT_URL or DATABASE_URL.");
  console.error("Set one in your shell, or add DATABASE_URL to apps/backend/.env.");
  process.exit(1);
}

// Windows can include special env keys beginning with '=' that cause spawn EINVAL
// when passed explicitly. Keep only valid string key/value pairs.
const sanitizedEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key, value]) => !key.startsWith("=") && typeof value === "string"
  )
);

const child = spawn(`npm run -w backend ${prismaScript}`, {
  stdio: "inherit",
  shell: true,
  env: {
    ...sanitizedEnv,
    DIRECT_URL: directUrl ?? resolvedUrl,
    DATABASE_URL: databaseUrl ?? resolvedUrl,
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

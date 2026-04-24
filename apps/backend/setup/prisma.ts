import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Load database connection settings from environment variables.
dotenv.config();

// Use the direct database URL when available, otherwise fall back to the pooled URL.
// This adapter lets Prisma talk to PostgreSQL through the configured connection.
const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

// Export a single shared Prisma client instance for the backend.
// Reusing one client avoids unnecessary connection churn.
export const prisma = new PrismaClient({ adapter });
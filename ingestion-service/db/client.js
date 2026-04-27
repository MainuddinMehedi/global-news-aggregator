import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

// Initialize a pg pool with the database connection string
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure Prisma to use the pg pool
const adapter = new PrismaPg(pool);

// Export a singleton instance of the Prisma Client
export const prisma = new PrismaClient({ adapter });

import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient Singleton helper.
 * This ensures that only one instance of PrismaClient is created and reused across your application,
 * which is critical for managing database connections efficiently.
 */

const prismaClientSingleton = () => {
  return new PrismaClient({
    // We use the pooled DATABASE_URL for runtime queries to optimize performance.
    // The DIRECT_URL is reserved for migrations in prisma.config.ts.
    datasourceUrl: process.env.DATABASE_URL,
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

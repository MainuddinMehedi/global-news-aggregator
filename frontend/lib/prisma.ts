import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Use pooled connection for app runtime
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// import { PrismaClient } from '@prisma/client';

// /**
//  * PrismaClient Singleton helper.
//  * This ensures that only one instance of PrismaClient is created and reused across your application,
//  * which is critical for managing database connections efficiently.
//  */

// const prismaClientSingleton = () => {
//   return new PrismaClient({
//     // We use the pooled DATABASE_URL for runtime queries to optimize performance.
//     // The DIRECT_URL is reserved for migrations in prisma.config.ts.
//     datasourceUrl: process.env.DATABASE_URL,
//   });
// };

// declare global {
//   var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
// }

// const prisma = globalThis.prisma ?? prismaClientSingleton();

// export default prisma;

// if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

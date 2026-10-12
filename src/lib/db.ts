import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One client per server instance (important for dev hot-reload and serverless).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    }
    // DATABASE_URL should be the Neon *pooled* connection string.
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return globalForPrisma.prisma;
}

// Created lazily on first use, so builds and pages that never touch the database
// work even before DATABASE_URL has been configured.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    // Bind methods such as $transaction to the real client, not to the proxy.
    return typeof value === "function" ? value.bind(client) : value;
  },
});

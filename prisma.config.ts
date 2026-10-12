import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL (non-pooled) is used by the Prisma CLI for migrations.
// The app itself connects at runtime through DATABASE_URL (pooled) in src/lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});

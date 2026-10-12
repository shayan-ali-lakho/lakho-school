import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Setup check for the test site: shows which settings exist (never their values)
// and whether the database answers. Remove or protect this before a real launch.
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
    AUTH_URL: Boolean(process.env.AUTH_URL),
  };

  let database: "ok" | "error" | "not configured" = "not configured";
  if (env.DATABASE_URL) {
    try {
      await db.user.count();
      database = "ok";
    } catch (error) {
      console.error("Health check: database query failed", error);
      database = "error";
    }
  }

  const healthy = env.DATABASE_URL && env.AUTH_SECRET && database === "ok";
  return NextResponse.json({ healthy, env, database }, { status: healthy ? 200 : 503 });
}

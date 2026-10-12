import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← {site.name}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">Portal sign in</h1>
        <p className="mt-1 text-sm text-zinc-600">Students, parents and staff.</p>
        <LoginForm />
      </div>
    </main>
  );
}

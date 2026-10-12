"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/portal",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") return "Invalid email or password.";
      // Anything else is a server problem (missing AUTH_SECRET, database unreachable...).
      // The real cause is in the Netlify function logs.
      console.error("Sign-in failed:", error.type, error.cause ?? error);
      return "Sign-in is unavailable because of a server configuration problem. Please tell the administrator.";
    }
    // A successful sign-in throws a redirect; it must be re-thrown.
    throw error;
  }
}

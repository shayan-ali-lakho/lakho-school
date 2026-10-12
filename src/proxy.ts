import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { USER_ADMIN_ROLES } from "@/lib/roles";

// Optimistic check only (reads the session cookie, no database call).
// Every portal page also re-checks the role on the server with requireRole().
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;

  if (nextUrl.pathname.startsWith("/portal")) {
    if (!user) {
      const url = new URL("/login", nextUrl);
      url.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    if (nextUrl.pathname.startsWith("/portal/admin") && !USER_ADMIN_ROLES.includes(user.role)) {
      return NextResponse.redirect(new URL("/portal", nextUrl));
    }
  }

  if (nextUrl.pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/portal", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/portal/:path*", "/login"],
};

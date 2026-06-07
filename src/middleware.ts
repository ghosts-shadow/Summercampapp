import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

/** Routes accessible without authentication. */
function isPublic(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login") return true;
  if (pathname.startsWith("/leaderboard")) return true;
  if (pathname.startsWith("/api/leaderboard")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/health")) return true;
  if (pathname.startsWith("/api/cron")) return true;
  return false;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const path = nextUrl.pathname;

  // Already authenticated users skip the login page.
  if (isLoggedIn && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Gate everything that is not explicitly public.
  if (!isLoggedIn && !isPublic(path)) {
    // API clients can't follow an HTML login redirect — return a proper 401.
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)",
  ],
};

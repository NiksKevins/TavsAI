import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isAppOrAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (isAppOrAuth) {
    return NextResponse.next();
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    "/",
    "/(lv|en)/:path*",
    "/demo",
    "/demo/:path*",
    "/how",
    "/how/:path*",
    "/pricing",
    "/pricing/:path*",
    "/faq",
    "/faq/:path*",
    "/industries",
    "/industries/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/partner/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password/:path*",
  ],
};

import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

const appAuth = auth(() => NextResponse.next());

function isAppOrAuthPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  );
}

function withSecurityHeaders(request: NextRequest, response: NextResponse) {
  const path = request.nextUrl.pathname;
  const isWidget =
    path.startsWith("/widget/") || path === "/widget.js" || path.startsWith("/api/widget/");

  if (isWidget) {
    // Customer sites embed the widget iframe — allow any parent frame.
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "frame-ancestors *",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline'",
        "connect-src 'self' https:",
        "object-src 'none'",
      ].join("; "),
    );
    response.headers.delete("X-Frame-Options");
  } else {
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
        "frame-ancestors 'self'",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://billing.stripe.com https://challenges.cloudflare.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com",
        "connect-src 'self' https://api.stripe.com https://*.stripe.com https://challenges.cloudflare.com https: wss:",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ].join("; "),
    );
  }

  return response;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  let response: NextResponse;
  if (isAppOrAuthPath(pathname)) {
    // Avoid decoding JWT on public marketing pages — faster first paint.
    response = (await appAuth(req, {} as never)) as NextResponse;
  } else {
    response = handleI18nRouting(req);
  }

  return withSecurityHeaders(req, response);
}

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
    "/privacy",
    "/privacy/:path*",
    "/cookies",
    "/cookies/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/partner/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password/:path*",
    "/widget/:path*",
  ],
};

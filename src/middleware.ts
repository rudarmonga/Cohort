import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

const AUTH_COOKIE_NAME = "jwt";

const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/signup"];
const PUBLIC_PAGES = ["/", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api");

  // Allow public API routes
  if (
    isApiRoute &&
    PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // 🔥 NEW LOGIC: If logged in & trying to access login/signup → redirect to /home
  if (token && (pathname === "/login" || pathname === "/signup")) {
  const url = new URL("/home", request.url);
  url.searchParams.set("alreadyLoggedIn", "true");
  return NextResponse.redirect(url);
}

  // Allow public pages (only if NOT redirected above)
  if (PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  // If no token → block access
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded = await verifyToken(token);

    const requestHeaders = new Headers(request.headers);

    if (decoded?.userId) {
      requestHeaders.set("x-user-id", String(decoded.userId));
    }

    if (decoded?.email) {
      requestHeaders.set("x-user-email", decoded.email);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 403 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}
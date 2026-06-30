// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/signup"];
const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public pages and API routes
  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // Allow static assets and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("cohort_token")?.value;

  if (!token) {
    // For API routes, return 401; for pages, redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    // Token is invalid or expired — clear cookie and redirect
    const response = pathname.startsWith("/api/")
      ? NextResponse.json(
          { success: false, error: "Session expired. Please log in again." },
          { status: 401 }
        )
      : NextResponse.redirect(new URL("/auth/login", req.url));

    response.cookies.delete("cohort_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
